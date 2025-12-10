from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import uuid
import hashlib
import secrets
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return {'error': 'Invalid token'}, 401
        if not token:
            return {'error': 'Token missing'}, 401
        # For now, accept any non-empty token
        return f(*args, **kwargs)
    return decorated


# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Create upload folders
os.makedirs(f'{app.config["UPLOAD_FOLDER"]}/tournament-posters', exist_ok=True)
os.makedirs(f'{app.config["UPLOAD_FOLDER"]}/product-images', exist_ok=True)
os.makedirs(f'{app.config["UPLOAD_FOLDER"]}/payment-receipts', exist_ok=True)

# ==================== MODELS ====================

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
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
    status = db.Column(db.String(50), default='scheduled')
    capacity = db.Column(db.Integer, default=32)
    created_by = db.Column(db.String(36), db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accept_entries = db.Column(db.Boolean, default=True)
    bracket_data = db.Column(db.JSON, nullable=True)
    status_override = db.Column(db.String(50), nullable=True)

    def get_status(self):
        """Return tournament status based on accept_entries / status_override."""
        if self.status_override:
            return self.status_override
        if self.accept_entries:
            return 'upcoming'
        return 'ongoing' if self.status != 'completed' else 'completed'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'venue': self.venue,
            'gmaps_link': self.gmaps_link,
            'status': self.get_status(),
            'price': self.price,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'capacity': self.capacity,
            'poster_url': self.poster_url,
            'created_by': self.created_by,
            'accept_entries': self.accept_entries,
            'bracket_data': self.bracket_data,
        }
    
    def get_status(self):
        """Return tournament status based on accept_entries"""
        if self.accept_entries:
            return 'upcoming'
        else:
            return 'ongoing'

class TournamentRegistration(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String(36), db.ForeignKey('tournament.id'), nullable=False)
    participant_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    academy_name = db.Column(db.String(255))
    selected_venue = db.Column(db.String(255))
    payment_id = db.Column(db.String(36), db.ForeignKey('payment.id'))
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, cancelled
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    seller_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    items = db.Column(db.JSON)  # Array of {product_id, quantity, price}
    total_amount = db.Column(db.Float, nullable=False)
    payment_id = db.Column(db.String(36), db.ForeignKey('payment.id'))
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, shipped, delivered, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Payment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='INR')
    payment_method = db.Column(db.String(50))  # card, upi, netbanking
    user_email = db.Column(db.String(120), nullable=False)
    reference_id = db.Column(db.String(36))  # tournament_id or order_id
    reference_type = db.Column(db.String(50))  # tournament or order
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    payment_proof_url = db.Column(db.String(500))
    verification_token = db.Column(db.String(500), unique=True)
    transaction_hash = db.Column(db.String(500), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)

class TournamentBracket(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String(36), db.ForeignKey('tournament.id'), nullable=False)
    bracket_data = db.Column(db.JSON)  # Bracket structure
    matches = db.Column(db.JSON)  # Array of match objects
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_transaction_id():
    """Generate unique transaction ID"""
    return f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(4)}"

def generate_verification_token():
    """Generate verification token for anti-fraud"""
    return secrets.token_urlsafe(32)

def generate_transaction_hash(transaction_id, amount, email, timestamp):
    """Generate hash to prevent replay attacks"""
    data = f"{transaction_id}{amount}{email}{timestamp}"
    return hashlib.sha256(data.encode()).hexdigest()

def save_upload_file(file, folder):
    """Save uploaded file safely"""
    if file and allowed_file(file.filename):
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], folder, filename)
        file.save(filepath)
        return f"/uploads/{folder}/{filename}"
    return None

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        email=email,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'access_token': access_token
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'access_token': access_token
    }), 200

# ==================== TOURNAMENT ROUTES (ADMIN) ====================

@app.route('/api/admin/tournaments', methods=['POST'])
@jwt_required()
def create_tournament():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.form
    
    # Handle file upload
    poster_url = None
    if 'poster' in request.files:
        poster_url = save_upload_file(request.files['poster'], 'tournament-posters')

    tournament = Tournament(
        name=data.get('name'),
        description=data.get('description'),
        venue=data.get('venue'),
        poster_url=poster_url,
        gmaps_link=data.get('gmaps_link'),
        start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%d').date(),
        start_time=datetime.strptime(data.get('start_time'), '%H:%M').time(),
        end_date=datetime.strptime(data.get('end_date'), '%Y-%m-%d').date(),
        end_time=datetime.strptime(data.get('end_time'), '%H:%M').time(),
        price=float(data.get('price', 0)),
        status=data.get('status', 'scheduled'),
        capacity=int(data.get('capacity', 32)),
        created_by=user_id
    )
    
    db.session.add(tournament)
    db.session.commit()
    
    return jsonify({
        'id': tournament.id,
        'message': 'Tournament created successfully'
    }), 201

# Admin: update accept_entries + bracket_data (used by admin-fix.html)
@app.route('/api/admin/tournaments/<tournament_id>/settings', methods=['PUT'])
@jwt_required()
def update_tournament_settings(tournament_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404

    data = request.get_json() or {}

    if 'accept_entries' in data:
        tournament.accept_entries = bool(data['accept_entries'])

    if 'bracket_data' in data:
        tournament.bracket_data = data['bracket_data']

    db.session.commit()
    return jsonify({'message': 'Tournament updated', 'tournament': tournament.to_dict()}), 200


@app.route('/api/admin/tournaments/<tournament_id>', methods=['PUT'])
@jwt_required()
def update_tournament(tournament_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404

    data = request.form
    
    tournament.name = data.get('name', tournament.name)
    tournament.description = data.get('description', tournament.description)
    tournament.venue = data.get('venue', tournament.venue)
    tournament.gmaps_link = data.get('gmaps_link', tournament.gmaps_link)
    tournament.price = float(data.get('price', tournament.price))
    tournament.status = data.get('status', tournament.status)
    tournament.capacity = int(data.get('capacity', tournament.capacity))
    
    if 'start_date' in data:
        tournament.start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
    if 'start_time' in data:
        tournament.start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
    if 'end_date' in data:
        tournament.end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
    if 'end_time' in data:
        tournament.end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
    
    if 'poster' in request.files:
        poster_url = save_upload_file(request.files['poster'], 'tournament-posters')
        if poster_url:
            tournament.poster_url = poster_url
    
    db.session.commit()
    return jsonify({'message': 'Tournament updated successfully'}), 200

# Admin: delete
@app.route('/api/admin/tournaments/<tournament_id>', methods=['DELETE'])
@jwt_required()
def delete_tournament(tournament_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404

    db.session.delete(tournament)
    db.session.commit()
    return jsonify({'message': 'Tournament deleted successfully'}), 200

# ADMIN: list tournaments for this admin (this is the one your JS is calling)
@app.route('/api/admin/tournaments', methods=['GET'])
@jwt_required()
def get_admin_tournaments():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    tournaments = Tournament.query.filter_by(created_by=user_id).all()
    return jsonify([t.to_dict() for t in tournaments]), 200

# ==================== TOURNAMENT ROUTES (USER) ====================

# List
@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    tournaments = Tournament.query.all()
    return jsonify([t.to_dict() for t in tournaments])

# Detail
@app.route('/api/tournaments/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404
    return jsonify(tournament.to_dict()), 200


@app.route('/api/tournaments/<tournament_id>/join', methods=['POST'])
def join_tournament(tournament_id):
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return {'error': 'Tournament not found'}, 404

    # IMPORTANT: block when entries closed
    if not tournament.accept_entries:
        return {
            'error': 'Tournament is closed for new entries',
            'status': tournament.get_status()
        }, 400

    data = request.get_json()
    registration = TournamentRegistration(
        tournament_id=tournament_id,
        participant_name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        academy_name=data.get('academy_name'),
        selected_venue=data.get('selected_venue'),
        status='pending'
    )
    db.session.add(registration)
    db.session.commit()
    return jsonify({'message': 'Tournament joined successfully'}), 201


@app.route('/api/admin/tournaments/<tournament_id>/registrations', methods=['GET'])
@jwt_required()
def get_registrations(tournament_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    registrations = TournamentRegistration.query.filter_by(tournament_id=tournament_id).all()
    return jsonify([{
        'id': r.id,
        'participant_name': r.participant_name,
        'phone': r.phone,
        'email': r.email,
        'academy_name': r.academy_name,
        'selected_venue': r.selected_venue,
        'status': r.status,
        'joined_at': r.joined_at.isoformat()
    } for r in registrations]), 200

# ==================== PRODUCT ROUTES (ADMIN) ====================

@app.route('/api/admin/products', methods=['POST'])
@jwt_required()
def create_product():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.form
    
    image_url = None
    if 'image' in request.files:
        image_url = save_upload_file(request.files['image'], 'product-images')

    product = Product(
        name=data.get('name'),
        description=data.get('description'),
        price=float(data.get('price')),
        stock=int(data.get('stock', 0)),
        category=data.get('category'),
        image_url=image_url,
        seller_id=user_id
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'message': 'Product created successfully'
    }), 201

@app.route('/api/admin/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.form
    
    product.name = data.get('name', product.name)
    product.description = data.get('description', product.description)
    product.price = float(data.get('price', product.price))
    product.stock = int(data.get('stock', product.stock))
    product.category = data.get('category', product.category)
    
    if 'image' in request.files:
        image_url = save_upload_file(request.files['image'], 'product-images')
        if image_url:
            product.image_url = image_url
    
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'}), 200

@app.route('/api/admin/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 200

@app.route('/api/admin/products', methods=['GET'])
@jwt_required()
def get_admin_products():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    products = Product.query.filter_by(seller_id=user_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'price': p.price,
        'stock': p.stock,
        'category': p.category,
        'image_url': p.image_url,
        'description': p.description
    } for p in products]), 200

# ==================== PRODUCT ROUTES (USER) ====================

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'price': p.price,
        'stock': p.stock,
        'category': p.category,
        'image_url': p.image_url,
        'description': p.description
    } for p in products]), 200

# ==================== ORDER ROUTES ====================

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    
    order = Order(
        customer_name=data.get('customer_name'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        city=data.get('city'),
        zip_code=data.get('zip_code'),
        items=data.get('items'),
        total_amount=float(data.get('total_amount')),
        status='pending'
    )
    
    db.session.add(order)
    db.session.commit()

    return jsonify({
        'order_id': order.id,
        'message': 'Order created, proceed to payment'
    }), 201

# ==================== PAYMENT ROUTES ====================

@app.route('/api/payments/initiate', methods=['POST'])
def initiate_payment():
    data = request.get_json()
    
    amount = data.get('amount')
    email = data.get('email')
    reference_id = data.get('reference_id')
    reference_type = data.get('reference_type')  # 'tournament' or 'order'
    
    # Generate unique identifiers
    transaction_id = generate_transaction_id()
    verification_token = generate_verification_token()
    timestamp = datetime.utcnow().isoformat()
    transaction_hash = generate_transaction_hash(transaction_id, amount, email, timestamp)
    
    payment = Payment(
        transaction_id=transaction_id,
        amount=amount,
        currency='INR',
        user_email=email,
        reference_id=reference_id,
        reference_type=reference_type,
        status='pending',
        verification_token=verification_token,
        transaction_hash=transaction_hash
    )
    
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'payment_id': payment.id,
        'transaction_id': transaction_id,
        'amount': amount,
        'verification_token': verification_token,
        'message': 'Payment initiated'
    }), 201

@app.route('/api/payments/verify', methods=['POST'])
def verify_payment():
    data = request.get_json()
    
    payment_id = data.get('payment_id')
    transaction_id = data.get('transaction_id')
    verification_token = data.get('verification_token')
    
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    # Anti-Fraud Checks
    if payment.transaction_id != transaction_id:
        return jsonify({'error': 'Transaction ID mismatch'}), 400
    
    if payment.verification_token != verification_token:
        return jsonify({'error': 'Invalid verification token'}), 400
    
    # Check for duplicate payment (within 5 minutes)
    duplicate = Payment.query.filter(
        Payment.user_email == payment.user_email,
        Payment.amount == payment.amount,
        Payment.reference_id == payment.reference_id,
        Payment.status == 'completed',
        Payment.verified_at > (datetime.utcnow() - timedelta(minutes=5))
    ).first()
    
    if duplicate:
        return jsonify({'error': 'Duplicate payment detected'}), 400
    
    # Mark payment as completed
    payment.status = 'completed'
    payment.verified_at = datetime.utcnow()
    
    # Update related records
    if payment.reference_type == 'tournament':
        registration = TournamentRegistration.query.filter_by(
            tournament_id=payment.reference_id,
            email=payment.user_email
        ).first()
        if registration:
            registration.payment_id = payment.id
            registration.status = 'confirmed'
    
    elif payment.reference_type == 'order':
        order = Order.query.get(payment.reference_id)
        if order:
            order.payment_id = payment.id
            order.status = 'confirmed'
            # Update product stock
            for item in order.items:
                product = Product.query.get(item['product_id'])
                if product:
                    product.stock -= item['quantity']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Payment verified successfully',
        'status': 'completed'
    }), 200

@app.route('/api/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    return jsonify({
        'id': payment.id,
        'transaction_id': payment.transaction_id,
        'amount': payment.amount,
        'currency': payment.currency,
        'status': payment.status,
        'user_email': payment.user_email,
        'reference_type': payment.reference_type,
        'created_at': payment.created_at.isoformat(),
        'verified_at': payment.verified_at.isoformat() if payment.verified_at else None
    }), 200

# ==================== BRACKET ROUTES ====================

@app.route('/api/admin/brackets', methods=['POST'])
@jwt_required()
def create_bracket():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    tournament_id = data.get('tournament_id')
    
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404

    bracket = TournamentBracket(
        tournament_id=tournament_id,
        bracket_data=data.get('bracket_data'),
        matches=[]
    )
    
    db.session.add(bracket)
    db.session.commit()
    
    return jsonify({
        'id': bracket.id,
        'message': 'Bracket created successfully'
    }), 201

@app.route('/api/admin/brackets/<tournament_id>', methods=['GET'])
@jwt_required()
def get_bracket(tournament_id):
    bracket = TournamentBracket.query.filter_by(tournament_id=tournament_id).first()
    if not bracket:
        return jsonify({'error': 'Bracket not found'}), 404
    
    return jsonify({
        'id': bracket.id,
        'tournament_id': bracket.tournament_id,
        'bracket_data': bracket.bracket_data,
        'matches': bracket.matches
    }), 200

@app.route('/api/admin/brackets/<bracket_id>/match', methods=['PUT'])
@jwt_required()
def update_bracket_match(bracket_id):
    bracket = TournamentBracket.query.get(bracket_id)
    if not bracket:
        return jsonify({'error': 'Bracket not found'}), 404

    data = request.get_json()
    match_data = data.get('match')
    
    if not bracket.matches:
        bracket.matches = []
    
    bracket.matches.append(match_data)
    bracket.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Match updated successfully'}), 200

# ==================== STATS ROUTES ====================

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    tournaments = Tournament.query.filter_by(created_by=user_id).all()
    tournament_ids = [t.id for t in tournaments]
    
    registrations = TournamentRegistration.query.filter(
        TournamentRegistration.tournament_id.in_(tournament_ids)
    ).count()
    
    products = Product.query.filter_by(seller_id=user_id).all()
    product_ids = [p.id for p in products]
    
    orders = Order.query.filter(
        Order.id.in_([item['order_id'] for item in db.session.query(Order.id).all()])
    ).count() if product_ids else 0
    
    completed_payments = Payment.query.filter(
        Payment.status == 'completed',
        Payment.reference_id.in_(tournament_ids + product_ids)
    ).all()
    
    revenue = sum(p.amount for p in completed_payments)
    
    return jsonify({
        'total_tournaments': len(tournaments),
        'total_players': registrations,
        'total_products': len(products),
        'total_orders': orders,
        'total_revenue': revenue,
        'pending_payments': Payment.query.filter_by(status='pending').count()
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# ==================== INITIALIZE DB ====================

@app.route('/api/init-db', methods=['POST'])
def init_db():
    db.create_all()
    
    # Create demo admin
    admin = User(
        email='admin@flylight.com',
        password=generate_password_hash('admin123'),
        role='admin'
    )
    
    try:
        db.session.add(admin)
        db.session.commit()
        return jsonify({'message': 'Database initialized successfully'}), 201
    except:
        db.session.rollback()
        return jsonify({'message': 'Database already initialized'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
