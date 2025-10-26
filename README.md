# ShetSarathi

ShetSarathi is a Virtual Agricultural Marketplace designed to transform agriculture by connecting farmers, specialists, and buyers. Leveraging machine learning and advanced databases, it offers personalized product insights, empowering farmers to make informed decisions. The platform aims to revolutionize the industry by enhancing market access, optimizing decision-making, and contributing to economic stability. ShetSarathi is not just a marketplace; it's a data-driven hub fostering efficiency and sustainability in agriculture.

## Presentation
PPT - [View Presentation](https://www.canva.com/design/DAGhHsl72PU/VT80xXI2_HHDmRInwffMdQ/edit?utm_content=DAGhHsl72PU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## Features

- **Chatbot**: AI-driven chatbot to assist farmers with queries.
- **Farmer Community**: A mentoring platform for farmers to share insights and seek guidance.
- **EduFarmer**: Educational resources to help farmers learn modern techniques and best practices.
- **Mentoring for Farmers**: Building a supportive network for collaboration and growth.
- **Warehouse & Transportation**: Connects farmers with storage and logistics services.
- **Bulk Order Negotiation**: Facilitates collective bargaining for better pricing.
- **Weather Updates via SMS**: Provides real-time weather updates directly to farmers.
- **SMS Alerts for Subsidies & Policies**: Notifies farmers about government schemes and subsidies.
- **Real-time Cost Analysis**: Helps farmers analyze market trends and optimize costs.
- **Crop Prediction**: AI-powered crop recommendation system for better yield predictions.

## Prerequisites

- Python 3.x (preferably Python 3.10 or higher)
- pip (Python package manager)
- Virtualenv (for creating isolated Python environments)
- Git (to clone the repository)

## Technologies Used

- Django 5.x
- scikit-learn
- Pillow
- and other libraries specified in `requirements.txt`

## Installation

Follow these steps to clone and set up the project on your local machine:

### 1. Clone the Repository

Start by cloning the repository to your local machine using the following command:
```bash
git clone https://github.com/your-username/ShetSarathi.git
cd ShetSarathi
```

### 2. Create and Activate Virtual Environment

Run the following commands to create and activate the virtual environment:

**On Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Dependencies

Once the virtual environment is activated, install the required dependencies:
```bash
pip install -r requirements.txt
```

This will install all the necessary packages such as Django, scikit-learn, Pillow, etc.

### 4. Apply Migrations

Next, apply the migrations to set up the database:
```bash
python manage.py migrate
```

### 5. Run the Development Server

Start the development server with the following command:
```bash
python manage.py runserver
```

Your project will now be running at [http://127.0.0.1:8000](http://127.0.0.1:8000).
