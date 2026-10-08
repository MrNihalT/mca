"""
views.py - the "V" in MVT.

A view is a Python function that receives a request and returns a response.
With DRF the response is JSON instead of an HTML page.

@api_view tells DRF which HTTP methods the view accepts and gives us the
browsable API page (open /api/items/ in a browser).
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Item
from .serializers import ItemSerializer


@api_view(["GET", "POST"])
def item_list(request):
    """GET  /api/items/   -> list all items
    POST /api/items/   -> create an item"""
    if request.method == "GET":
        items = Item.objects.all()
        return Response(ItemSerializer(items, many=True).data)

    serializer = ItemSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def item_detail(request, pk):
    """GET / PUT / DELETE  /api/items/<id>/"""
    item = get_object_or_404(Item, pk=pk)  # 404 if it does not exist

    if request.method == "GET":
        return Response(ItemSerializer(item).data)

    if request.method == "PUT":
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    item.delete()  # DELETE
    return Response(status=status.HTTP_204_NO_CONTENT)
