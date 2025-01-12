from flask import Flask, request, jsonify
import pandas as pd
from pybaseball import statcast

app = Flask(__name__)

# Default Values
start_date = '2024-04-01'
end_date = '2024-09-30'
min_pa = 900
min_ip = 1100
data = pd.read_csv('mlb_2024_filtered_data.csv')

# Sets new configured data
def reconfigure_data(min_pa, min_ip):
    global data
    print(f"Reconfiguring data with minPA={min_pa} and minIP={min_ip}...")
    data = pd.read_csv('mlb_2024_filtered_data.csv')
    pa_counts = data.groupby('batter').size().reset_index(name='PA')
    ip_counts = data.groupby('pitcher')['inning'].nunique().reset_index(name='IP')
    updated_data = data.merge(pa_counts, on='batter', how='left')
    updated_data = updated_data.merge(ip_counts, on='pitcher', how='left')
    filtered_data = updated_data[(updated_data['PA'] >= min_pa) & (updated_data['IP'] >= min_ip)]
    data = filtered_data
    return data

# Function to fetch and process Statcast data
def fetch_and_process_data():
    global data
    success_events = ['single', 'double', 'triple', 'home_run', 'walk']
    data['success'] = data['events'].isin(success_events).astype(int)
    # Translate descriptions to broader categories
    def translate_descriptions(df):
        translation_map = {
            'called_strike': 'Strike',
            'swinging_strike': 'Strike',
            'foul': 'Foul',
            'ball': 'Ball',
            'hit_by_pitch': 'Ball',
            'single': 'Hit',
            'double': 'Hit',
            'triple': 'Hit',
            'home_run': 'Hit',
            'groundout': 'Out',
            'flyout': 'Out',
            'lineout': 'Out',
            'strikeout': 'Out',
            'field_out': 'Out',
            'force_out': 'Out',
            'double_play': 'Out',
            'sac_fly': 'Out',
            'sac_bunt': 'Out',
            'intent_walk': 'Ball',
            'blocked_ball': 'Ball',
        }
        df['Result'] = df['description'].map(translation_map).fillna('Unknown')
        return df
    data = translate_descriptions(data)
    return data

# Process the data initially to add derived columns
data = fetch_and_process_data()

@app.route('/analyze_success', methods=['POST'])
def analyze_success():
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