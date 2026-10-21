from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import local models
from core.models import Book, Review, ReadingList

# --- Serializers ---
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = ['id', 'book', 'user', 'username', 'rating', 'review_text', 'created_at']
        read_only_fields = ['user']

class BookSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'genre', 'description', 'cover_image', 'average_rating', 'created_by', 'created_by_username', 'reviews']
        read_only_fields = ['created_by']

class ReadingListSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = ReadingList
        fields = ['id', 'user', 'book', 'book_details', 'status', 'updated_at']
        read_only_fields = ['user']

# --- Views & ViewSets ---
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Registration successful'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get('search', None)
        genre = self.request.query_params.get('genre', None)
        if query:
            queryset = queryset.filter(title__icontains=query) | queryset.filter(author__icontains=query)
        if genre and genre != 'All':
            queryset = queryset.filter(genre__iexact=genre)
        return queryset

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_review(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    review, _ = Review.objects.update_or_create(
        book=book,
        user=request.user,
        defaults={
            'rating': request.data.get('rating', 5),
            'review_text': request.data.get('review_text', '')
        }
    )
    return Response(ReviewSerializer(review).data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def manage_reading_list(request):
    if request.method == 'GET':
        items = ReadingList.objects.filter(user=request.user).select_related('book')
        return Response(ReadingListSerializer(items, many=True).data)

    if request.method == 'POST':
        book_id = request.data.get('book_id')
        shelf_status = request.data.get('status', 'Want to Read')
        item, _ = ReadingList.objects.update_or_create(
            user=request.user,
            book_id=book_id,
            defaults={'status': shelf_status}
        )
        return Response(ReadingListSerializer(item).data)

# --- Combined URLs ---
urlpatterns = [
    path('api/register/', register_user),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/books/', BookViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('api/books/<int:pk>/', BookViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('api/books/<int:book_id>/reviews/', add_review),
    path('api/reading-list/', manage_reading_list),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)