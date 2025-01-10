from flask import Flask, request, jsonify
import pandas as pd
from pybaseball import statcast

app = Flask(__name__)

# Configuration for data fetching
start_date = '2023-04-01'
end_date = '2023-09-30'
min_pa = 10  # Minimum plate appearances
min_ip = 5   # Minimum innings pitched

# Function to fetch and process Statcast data
def fetch_and_process_data():
    data = statcast(start_dt=start_date, end_dt=end_date)
    selected_columns = [
        'pitch_type', 'release_speed', 'batter', 'events', 
        'plate_x', 'plate_z', 'description', 'game_date', 'inning', 'pitcher',
        'balls', 'strikes'
    ]
    data = data[selected_columns]

    # Calculate PA and IP
    pa_counts = data.groupby('batter').size().reset_index(name='PA')
    ip_counts = data.groupby('pitcher')['inning'].nunique().reset_index(name='IP')

    # Merge and filter
    data = data.merge(pa_counts, on='batter', how='left')
    data = data.merge(ip_counts, on='pitcher', how='left')
    data = data[(data['PA'] >= min_pa) & (data['IP'] >= min_ip)]

    # Define success events
    success_events = ['single', 'double', 'triple', 'home_run', 'walk']
    data['success'] = data['events'].isin(success_events).astype(int)
    return data

# Fetch the data once to serve as a cache
data = fetch_and_process_data()

@app.route('/analyze_scenario', methods=['GET'])
def analyze_scenario():
    balls = int(request.args.get('balls', 0))
    strikes = int(request.args.get('strikes', 0))

    scenario_data = data[(data['balls'] == balls) & (data['strikes'] == strikes)]
    if scenario_data.empty:
        return jsonify({'error': f'No data available for count {balls}-{strikes}'}), 404

    analysis = scenario_data.groupby('pitch_type').agg(
        total_pitches=('pitch_type', 'size'),
        successes=('success', 'sum')
    ).reset_index()
    analysis['success_rate'] = analysis['successes'] / analysis['total_pitches']

    return jsonify(analysis.to_dict(orient='records'))

@app.route('/analyze_pitch_sequence', methods=['POST'])
def analyze_pitch_sequence():
    sequence = request.json.get('sequence', [])

    if not sequence:
        return jsonify({'error': 'Sequence cannot be empty'}), 400

    sequence_length = len(sequence)
    data['sequence_match'] = False
    for idx in range(len(data) - sequence_length + 1):
        if list(data['pitch_type'].iloc[idx:idx + sequence_length]) == sequence:
            data.at[idx + sequence_length - 1, 'sequence_match'] = True

    sequence_data = data[data['sequence_match']]
    if sequence_data.empty:
        return jsonify({'error': f'No data available for pitch sequence {sequence}'}), 404

    analysis = sequence_data.groupby('pitch_type').agg(
        total_pitches=('pitch_type', 'size'),
        successes=('success', 'sum')
    ).reset_index()
    analysis['success_rate'] = analysis['successes'] / analysis['total_pitches']

    return jsonify(analysis.to_dict(orient='records'))

@app.route('/analyze_scenario_and_sequence', methods=['POST'])
def analyze_scenario_and_sequence():
    balls = int(request.json.get('balls', 0))
    strikes = int(request.json.get('strikes', 0))
    sequence = request.json.get('sequence', [])

    scenario_data = data[(data['balls'] == balls) & (data['strikes'] == strikes)]
    if scenario_data.empty:
        return jsonify({'error': f'No data available for count {balls}-{strikes}'}), 404

    sequence_length = len(sequence)
    scenario_data['sequence_match'] = False

    for idx in range(len(scenario_data) - sequence_length + 1):
        if list(scenario_data['pitch_type'].iloc[idx:idx + sequence_length]) == sequence:
            scenario_data.at[idx + sequence_length - 1, 'sequence_match'] = True

    sequence_data = scenario_data[scenario_data['sequence_match']]
    if sequence_data.empty:
        return jsonify({'error': f'No data available for pitch sequence {sequence} at count {balls}-{strikes}'}), 404

    analysis = sequence_data.groupby('pitch_type').agg(
        total_pitches=('pitch_type', 'size'),
        successes=('success', 'sum')
    ).reset_index()
    analysis['success_rate'] = analysis['successes'] / analysis['total_pitches']

    return jsonify(analysis.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
