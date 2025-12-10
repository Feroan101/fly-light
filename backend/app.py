from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import uuid
import hashlib
import secrets
from functools import wraps

# ==================== INITIALIZATION ====================

app = Flask(__name__)

# CORS Configuration - FIXED ISSUE
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600
    }
})

# Database and JWT Config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skylight.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['UPLOAD_FOLDER'] = 'uploads'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Create upload directories
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tournament-posters'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'product-images'), exist_ok=True)

# ==================== MODELS ====================

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Tournament(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    venue = db.Column(db.String(255), nullable=False)
    poster_url = db.Column(db.String(500))
    gmaps_link = db.Column(db.String(500))
    start_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Float, default=0)
    capacity = db.Column(db.Integer, default=32)
    status = db.Column(db.String(50), default='upcoming')  # upcoming, ongoing, completed
    accept_entries = db.Column(db.Boolean, default=True)
    bracket_data = db.Column(db.JSON)
    created_by = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'venue': self.venue,
            'gmaps_link': self.gmaps_link,
            'poster_url': self.poster_url,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'price': self.price,
            'capacity': self.capacity,
            'status': self.status,
            'accept_entries': self.accept_entries,
            'bracket_data': self.bracket_data,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TournamentRegistration(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String(36), db.ForeignKey('tournament.id'), nullable=False)
    participant_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    academy_name = db.Column(db.String(255))
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, cancelled
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'participant_name': self.participant_name,
            'email': self.email,
            'phone': self.phone,
            'academy_name': self.academy_name,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }

class Product(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    seller_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'stock': self.stock,
            'category': self.category,
            'image_url': self.image_url,
            'seller_id': self.seller_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Order(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    items = db.Column(db.JSON, nullable=False)  # [{product_id, quantity, price}]
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, shipped, delivered
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'zip_code': self.zip_code,
            'items': self.items,
            'total_amount': self.total_amount,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Payment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='INR')
    user_email = db.Column(db.String(120), nullable=False)
    reference_id = db.Column(db.String(36))  # tournament_id or order_id
    reference_type = db.Column(db.String(50))  # tournament or order
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'amount': self.amount,
            'currency': self.currency,
            'user_email': self.user_email,
            'reference_id': self.reference_id,
            'reference_type': self.reference_type,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }

# ==================== UTILITY FUNCTIONS ====================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_upload_file(file, folder):
    """Save uploaded file safely"""
    if file and allowed_file(file.filename):
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], folder, filename)
        file.save(filepath)
        return f"/uploads/{folder}/{filename}"
    return None

def generate_transaction_id():
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_str = secrets.token_hex(4)
    return f"TXN-{timestamp}-{random_str}"

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            role=data.get('role', 'user')
        )
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'access_token': access_token,
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'access_token': access_token,
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== TOURNAMENT ROUTES (ADMIN) ====================

@app.route('/api/admin/tournaments', methods=['POST'])
@jwt_required()
def create_tournament():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.form
        
        # Validate required fields
        required = ['name', 'venue', 'start_date', 'start_time', 'end_date', 'end_time']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        poster_url = None
        if 'poster' in request.files:
            poster_url = save_upload_file(request.files['poster'], 'tournament-posters')
        
        tournament = Tournament(
            name=data['name'],
            description=data.get('description', ''),
            venue=data['venue'],
            poster_url=poster_url,
            gmaps_link=data.get('gmaps_link', ''),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            end_time=datetime.strptime(data['end_time'], '%H:%M').time(),
            price=float(data.get('price', 0)),
            capacity=int(data.get('capacity', 32)),
            status=data.get('status', 'upcoming'),
            created_by=user_id
        )
        
        db.session.add(tournament)
        db.session.commit()
        
        return jsonify({
            'id': tournament.id,
            'message': 'Tournament created successfully',
            'tournament': tournament.to_dict()
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/tournaments/<tournament_id>', methods=['PUT'])
@jwt_required()
def update_tournament(tournament_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        data = request.form
        
        # Update fields
        if 'name' in data:
            tournament.name = data['name']
        if 'description' in data:
            tournament.description = data['description']
        if 'venue' in data:
            tournament.venue = data['venue']
        if 'gmaps_link' in data:
            tournament.gmaps_link = data['gmaps_link']
        if 'price' in data:
            tournament.price = float(data['price'])
        if 'capacity' in data:
            tournament.capacity = int(data['capacity'])
        if 'status' in data:
            tournament.status = data['status']
        if 'accept_entries' in data:
            tournament.accept_entries = data['accept_entries'].lower() == 'true'
        
        if 'start_date' in data:
            tournament.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'start_time' in data:
            tournament.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_date' in data:
            tournament.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'end_time' in data:
            tournament.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        if 'poster' in request.files:
            poster_url = save_upload_file(request.files['poster'], 'tournament-posters')
            if poster_url:
                tournament.poster_url = poster_url
        
        db.session.commit()
        
        return jsonify({
            'message': 'Tournament updated successfully',
            'tournament': tournament.to_dict()
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/tournaments/<tournament_id>', methods=['DELETE'])
@jwt_required()
def delete_tournament(tournament_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        db.session.delete(tournament)
        db.session.commit()
        
        return jsonify({'message': 'Tournament deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/tournaments', methods=['GET'])
@jwt_required()
def get_admin_tournaments():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        tournaments = Tournament.query.filter_by(created_by=user_id).all()
        
        return jsonify([t.to_dict() for t in tournaments]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/tournaments/<tournament_id>/registrations', methods=['GET'])
@jwt_required()
def get_registrations(tournament_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        registrations = TournamentRegistration.query.filter_by(tournament_id=tournament_id).all()
        
        return jsonify([r.to_dict() for r in registrations]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== TOURNAMENT ROUTES (USER) ====================

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    try:
        tournaments = Tournament.query.all()
        return jsonify([t.to_dict() for t in tournaments]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tournaments/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    try:
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        return jsonify(tournament.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tournaments/<tournament_id>/join', methods=['POST'])
def join_tournament(tournament_id):
    try:
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        if not tournament.accept_entries:
            return jsonify({'error': 'Tournament is closed for new entries', 'status': tournament.status}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required = ['name', 'email', 'phone']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        registration = TournamentRegistration(
            tournament_id=tournament_id,
            participant_name=data['name'],
            email=data['email'],
            phone=data['phone'],
            academy_name=data.get('academy_name', ''),
            status='pending'
        )
        
        db.session.add(registration)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'registration': registration.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCT ROUTES (ADMIN) ====================

@app.route('/api/admin/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.form
        
        # Validate required fields
        required = ['name', 'price']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        image_url = None
        if 'image' in request.files:
            image_url = save_upload_file(request.files['image'], 'product-images')
        
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            stock=int(data.get('stock', 0)),
            category=data.get('category', ''),
            image_url=image_url,
            seller_id=user_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'id': product.id,
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.form
        
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'stock' in data:
            product.stock = int(data['stock'])
        if 'category' in data:
            product.category = data['category']
        
        if 'image' in request.files:
            image_url = save_upload_file(request.files['image'], 'product-images')
            if image_url:
                product.image_url = image_url
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products', methods=['GET'])
@jwt_required()
def get_admin_products():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        products = Product.query.filter_by(seller_id=user_id).all()
        
        return jsonify([p.to_dict() for p in products]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCT ROUTES (USER) ====================

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = Product.query.all()
        return jsonify([p.to_dict() for p in products]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ORDER ROUTES ====================

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['customer_name', 'email', 'phone', 'address', 'city', 'zip_code', 'items', 'total_amount']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        order = Order(
            customer_name=data['customer_name'],
            email=data['email'],
            phone=data['phone'],
            address=data['address'],
            city=data['city'],
            zip_code=data['zip_code'],
            items=data['items'],
            total_amount=float(data['total_amount']),
            status='pending'
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'order_id': order.id,
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PAYMENT ROUTES ====================

@app.route('/api/payments/initiate', methods=['POST'])
def initiate_payment():
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['amount', 'email', 'reference_id', 'reference_type']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        transaction_id = generate_transaction_id()
        
        payment = Payment(
            transaction_id=transaction_id,
            amount=float(data['amount']),
            currency='INR',
            user_email=data['email'],
            reference_id=data['reference_id'],
            reference_type=data['reference_type'],
            status='pending'
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'payment_id': payment.id,
            'transaction_id': transaction_id,
            'amount': payment.amount,
            'message': 'Payment initiated',
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/<payment_id>/verify', methods=['POST'])
def verify_payment(payment_id):
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        payment.status = 'completed'
        payment.verified_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Payment verified successfully',
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        return jsonify(payment.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ADMIN STATS ====================

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        tournaments = Tournament.query.filter_by(created_by=user_id).all()
        tournament_ids = [t.id for t in tournaments]
        
        registrations = TournamentRegistration.query.filter(
            TournamentRegistration.tournament_id.in_(tournament_ids)
        ).count()
        
        products = Product.query.filter_by(seller_id=user_id).all()
        product_ids = [p.id for p in products]
        
        total_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.reference_id.in_(tournament_ids + product_ids)
        ).scalar() or 0
        
        return jsonify({
            'total_tournaments': len(tournaments),
            'total_registrations': registrations,
            'total_products': len(products),
            'total_revenue': float(total_revenue),
            'pending_payments': Payment.query.filter_by(status='pending').count()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FILE SERVING ====================

@app.route('/uploads/<path:filepath>')
def serve_upload(filepath):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filepath)
    except:
        return jsonify({'error': 'File not found'}), 404

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# ==================== DATABASE INITIALIZATION ====================

@app.route('/api/init-db', methods=['POST'])
def init_db():
    try:
        db.create_all()
        
        # Create demo admin if doesn't exist
        if not User.query.filter_by(email='admin@skylight.com').first():
            admin = User(
                email='admin@skylight.com',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            return jsonify({'message': 'Database initialized and admin user created'}), 201
        else:
            return jsonify({'message': 'Database already initialized'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== RUN APP ====================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(debug=True, host='0.0.0.0', port=5000)