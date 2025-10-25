import joblib as joblib
import pandas as pd
from surprise import Dataset, Reader, KNNBasic
from django.urls import reverse
from django.shortcuts import render, redirect,get_object_or_404
# from .forms import RegistrationForm, UserForm, UserProfileForm
from app.models import Account, UserProfile
# from orders.models import Order, OrderProduct
# from cart.models import Cart, CartItem
# from cart.views import _cart_id
import requests
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.contrib import messages, auth
from django.contrib.auth.decorators import login_required

from orders.models import Order
from .forms import AddProductForm
# Create your views here.
"""verification email"""
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMessage
from django.views.generic import ListView
from category.models import Category
from store.models import Product
from app.models import Account
from django import forms
from sklearn.utils.validation import check_is_fitted
import os
# Load the pre-trained models safely
try:
    model_path = 'E:/ashi/AgroPlace/farmer/model/product_trending_model.pkl'
    
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        
        # Check if the model is trained
        try:
            check_is_fitted(model)
        except:
            print("Model is not fitted. Please train and save the model again.")
            model = None
    else:
        print("Model file not found.")
        model = None

except (FileNotFoundError, AttributeError):
    print("Error loading the model.")
    model = None


def products(request):
    farmerid = Account.objects.get(email=request.user)
    products = Product.objects.filter(farmerID=farmerid.id)
    return render(request, 'products.html', {'products': products})

def expert_advice(request):
    sp = Account.objects.filter(user_role='specialist')
    return render(request, 'expert_advice.html', {'sp': sp})

@login_required(login_url='login')
def add_products(request):
    if request.method == "POST":
        add_product_form = AddProductForm(request.POST, request.FILES)  # Handle image uploads

        if add_product_form.is_valid():
            # Retrieve form data
            product_name = add_product_form.cleaned_data['product_name']
            description = add_product_form.cleaned_data['description']
            price = add_product_form.cleaned_data['price']
            image = add_product_form.cleaned_data['image']
            category = add_product_form.cleaned_data['category']
            quantity = add_product_form.cleaned_data['quantity']

            # Get farmer (logged-in user)
            farmer = request.user

            # Retrieve the farmer's location from their profile
            try:
                user_profile = UserProfile.objects.get(user_id=farmer.id)
                city = user_profile.city
                state = user_profile.state
                country = user_profile.country
            except UserProfile.DoesNotExist:
                # If no profile exists, use empty/default values
                city = ""
                state = ""
                country = ""

            # Create and save a new Product instance with location
            new_product = Product(
                farmerID=farmer.id,
                product_name=product_name,
                description=description,
                price=price,
                image=image,
                category=category,
                quantity=quantity,
                city=city,  # Include location fields
                state=state,
                country=country
            )
            new_product.save()

            messages.success(request, "Product added successfully!")
            return redirect('farmer:products')

    else:
        add_product_form = AddProductForm()

    return render(request, 'add_product.html', {'add_product_form': add_product_form})


@login_required(login_url='login')
def edit_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == "POST":
        form = AddProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()  # Save the updated product data
            return redirect('farmer:products')
    else:
        form = AddProductForm(instance=product)

    context = {
        'form' : form,
        'product_id' : product_id
    }

    return render(request, 'edit_product.html', context)


@login_required(login_url='login')
def delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    return redirect('farmer:products')

@login_required(login_url='login')
def farmerOrder(request, user_id):
    orders = Order.objects.filter(farmer_id=user_id).order_by('-status', 'created_at')
    
    # Check if orders are not empty
    if orders.exists():
        status = orders.first().status
    else:
        status = None  # Or set a default value like 'No orders'

    context = {
        'orders': orders,
        'order_status': status
    }
    
    return render(request, 'order.html', context)


@login_required(login_url='login')
def change_status(request, order_id):
    if request.method == 'POST':
        userid = request.user.id
        new_status = request.POST.get('status')  # Use the correct field name
        order =Order.objects.get(id=order_id)
        order.status = new_status
        order.save()

        # You can redirect to the order list or any other page
        return redirect('farmer:farmerOrder', user_id=userid)


    return HttpResponse("Bad Request", status=400)


def insights(request):
    if model is None:
        return HttpResponse("Model is not available. Please train the model first.", status=500)
    
    products = Product.objects.all()
    product_sales = []
    for product in products:
        category_value = getattr(product.category, 'id', 0)  # Ensure category is numerical
        product_sales.append([product.price, category_value, product.quantity])
    
    try:
        trending_scores = model.predict(product_sales)
        trending_products = sorted(zip(products, trending_scores), key=lambda x: x[1], reverse=True)
        trending_products_list = [(p.product_name, int(score)) for p, score in trending_products[:5]]
    except Exception as e:
        return HttpResponse(f"Error during prediction: {str(e)}", status=500)
    
    return render(request, 'insights.html', {'trending_products_list': trending_products_list})
