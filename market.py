import sqlite3
import pandas as pd
import time
from tabulate import tabulate
import os

# Database connection
DB_PATH = "db.sqlite3"  # Replace with your actual database path

def fetch_price_comparison():
    """Fetch and compare crop prices across different cities."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # SQL Query to fetch product prices grouped by city and farmer
    query = """
    SELECT 
        u.city, 
        p.product_name, 
        p.price
    FROM store_product p
    JOIN app_userprofile u ON p.farmerID = u.id
    ORDER BY p.product_name, p.price;
    """

    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()

    # Convert to DataFrame
    df = pd.DataFrame(data, columns=["City", "Product Name", "Price"])
    
    return df

def display_price_comparison():
    """Continuously fetch and display product price comparisons across cities."""
    while True:
        df = fetch_price_comparison()
        
        # Clear the screen for real-time effect
        os.system("cls" if os.name == "nt" else "clear")
        
        print("\n📊 *Product Price Comparison Across Cities* 📊\n")
        
        # Group data by Product Name
        grouped = df.groupby("Product Name")
        
        for product, group in grouped:
            print(f"🔹 {product.upper()} Price Comparison:")
            
            # Calculate min, max, and average prices for each city
            price_comparison = group.groupby("City")["Price"].agg(["min", "max", "mean"]).reset_index()
            
            print(tabulate(price_comparison, headers="keys", tablefmt="fancy_grid"))
            print("\n")  # Extra space between products
        
        # Refresh every 10 seconds
        time.sleep(10)

# Run the real-time display
if __name__ == "__main__":
    display_price_comparison()
