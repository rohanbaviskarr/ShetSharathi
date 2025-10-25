import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# Load and preprocess data once
df = pd.read_csv("best_crop_recommendation.csv")

# Encode categorical variables
label_encoders = {}
categorical_columns = ["State", "Season", "Soil Type"]
for col in categorical_columns:
    label_encoders[col] = LabelEncoder()
    df[col] = label_encoders[col].fit_transform(df[col])

y_encoder = LabelEncoder()
df["Recommended Crop"] = y_encoder.fit_transform(df["Recommended Crop"])

X = df.drop(columns=["Recommended Crop"])
y = df["Recommended Crop"]

# Train model once
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Ensure an argument is passed
if len(sys.argv) < 2:
    print(json.dumps({"error": "No input data provided"}))
    sys.exit(1)

# Parse input JSON safely
try:
    input_data = json.loads(sys.argv[1])
except json.JSONDecodeError:
    print(json.dumps({"error": "Invalid JSON format"}))
    sys.exit(1)

# Extract and validate input values
try:
    state = input_data['state']
    season = input_data['season']
    soil_type = input_data['soilType']
    rainfall = float(input_data['rainfall'])
    temperature = float(input_data['temperature'])
    market_price = float(input_data['marketPrice'])
    demand_factor = float(input_data['demandFactor'])
except (KeyError, ValueError) as e:
    print(json.dumps({"error": f"Invalid or missing input field: {str(e)}"}))
    sys.exit(1)

# Encode inputs
try:
    state_encoded = label_encoders["State"].transform([state])[0]
    season_encoded = label_encoders["Season"].transform([season])[0]
    soil_type_encoded = label_encoders["Soil Type"].transform([soil_type])[0]
except ValueError as e:
    print(json.dumps({"error": f"Invalid category value: {str(e)}"}))
    sys.exit(1)

# Create input array and predict
input_array = np.array([[state_encoded, season_encoded, soil_type_encoded, rainfall, temperature, market_price, demand_factor]])
prediction_encoded = model.predict(input_array)
predicted_crop = y_encoder.inverse_transform(prediction_encoded)[0]

# Return result
result = {'crop': predicted_crop}
print(json.dumps(result))
