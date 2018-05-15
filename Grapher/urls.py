from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('graph/<str:team>/<str:channel>', views.xml, name='xml'),
    path('channels/<str:team>', views.channels, name='channels'),
    path('teams/', views.teams, name='teams'),
    path('person/<str:id>', views.person, name='person'),
    path('edge/<str:node1>/<str:node2>', views.edge, name='edge'),
]
