import sys
import json
import pandas as pd
import pmdarima as pm
from statsmodels.tsa.arima.model import ARIMA

# Get today's date (hardcoded as March 08, 2025)
TODAY = pd.to_datetime("2025-03-08")

# Check if input is provided
if len(sys.argv) < 2:
    print(json.dumps({'error': 'Missing input data. Provide a JSON string as an argument.'}))
    sys.exit(1)

# Try to parse the JSON input
try:
    input_data = json.loads(sys.argv[1])
except json.JSONDecodeError:
    print(json.dumps({'error': 'Invalid JSON input. Ensure proper escaping of quotes.'}))
    sys.exit(1)

# Extract values from input
prices = input_data.get('prices', [])

# Always use today's date
last_date = TODAY

# Validate input data
if not prices or len(set(prices)) <= 1:
    print(json.dumps({'error': 'Not enough price variations to generate a forecast.'}))
    sys.exit(0)

# Fit ARIMA model
model = pm.auto_arima(prices, seasonal=False, stepwise=True)
arima_model = ARIMA(prices, order=model.order).fit()

# Forecast next 5 days starting from today
forecast_period = 5
future_dates = pd.date_range(last_date, periods=forecast_period + 1, freq='D')[1:]
forecast_values = arima_model.forecast(steps=forecast_period)

# Output results in JSON format
result = {'forecast': [{'date': str(date), 'price': float(price)} for date, price in zip(future_dates, forecast_values)]}
print(json.dumps(result))