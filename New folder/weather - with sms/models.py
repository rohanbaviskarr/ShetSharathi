from django.contrib.auth.models import User
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255, unique=True)
    image = models.ImageField(upload_to='products/photos')
    
    # Additional fields for insights function
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # Product price
    category = models.CharField(max_length=100, default="General")  # Product category
    quantity = models.IntegerField(default=0)  # Stock quantity
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    def __str__(self):
        return self.name


class Recommendation(models.Model):
    recommendation_order = models.IntegerField()
    score = models.FloatField()

    def __str__(self):
        return f"Recommendation {self.id}"
