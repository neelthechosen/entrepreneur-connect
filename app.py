from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Post, Comment, Like
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db').replace('postgres://', 'postgresql://')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists - robust version
upload_folder = app.config['UPLOAD_FOLDER']

# Check if path exists and is a file (not a directory)
if os.path.exists(upload_folder) and not os.path.isdir(upload_folder):
    # Remove the file if it exists
    os.remove(upload_folder)
    
# Create the directory (will not error if it already exists)
os.makedirs(upload_folder, exist_ok=True)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables
with app.app_context():
    db.create_all()

# Helper function for allowed files
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('feed'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('feed'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        name = request.form.get('name')
        password = request.form.get('password')
        
        # Check if user exists
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists')
            return redirect(url_for('register'))
        
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email already exists')
            return redirect(url_for('register'))
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            name=name,
            password=generate_password_hash(password, method='sha256')
        )
        
        db.session.add(new_user)
        db.session.commit()
        flash('Account created successfully. Please log in.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('feed'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again.')
            return redirect(url_for('login'))
        
        login_user(user, remember=remember)
        return redirect(url_for('feed'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/feed')
@login_required
def feed():
    # Get all posts with their authors, ordered by creation date (newest first)
    posts = Post.query.order_by(Post.created_at.desc()).all()
    
    # For each post, get the author information
    posts_with_authors = []
    for post in posts:
        author = User.query.get(post.user_id)
        posts_with_authors.append({
            'post': post,
            'author': author
        })
    
    return render_template('feed.html', posts=posts_with_authors)

@app.route('/create_post', methods=['GET', 'POST'])
@login_required
def create_post():
    if request.method == 'POST':
        content = request.form.get('content')
        image = request.files.get('image')
        
        if not content:
            flash('Post content cannot be empty')
            return redirect(url_for('create_post'))
        
        filename = None
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            filename = f"{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        new_post = Post(
            content=content,
            image=filename,
            user_id=current_user.id
        )
        
        db.session.add(new_post)
        db.session.commit()
        flash('Post created successfully!')
        return redirect(url_for('feed'))
    
    return render_template('create_post.html')

@app.route('/profile/<username>')
@login_required
def profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(user_id=user.id).order_by(Post.created_at.desc()).all()
    return render_template('profile.html', user=user, posts=posts)

@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        name = request.form.get('name')
        bio = request.form.get('bio')
        profile_picture = request.files.get('profile_picture')
        
        current_user.name = name
        current_user.bio = bio
        
        if profile_picture and allowed_file(profile_picture.filename):
            filename = secure_filename(profile_picture.filename)
            filename = f"profile_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            profile_picture.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
            # Delete old profile picture if it's not the default
            if current_user.profile_picture and current_user.profile_picture != 'default_profile.png':
                old_file = os.path.join(app.config['UPLOAD_FOLDER'], current_user.profile_picture)
                if os.path.exists(old_file):
                    os.remove(old_file)
            
            current_user.profile_picture = filename
        
        db.session.commit()
        flash('Profile updated successfully!')
        return redirect(url_for('profile', username=current_user.username))
    
    return render_template('edit_profile.html')

@app.route('/post/<int:post_id>')
@login_required
def post_detail(post_id):
    post = Post.query.get_or_404(post_id)
    author = User.query.get(post.user_id)
    return render_template('post_detail.html', post=post, author=author)

@app.route('/like/<int:post_id>', methods=['POST'])
@login_required
def like_post(post_id):
    post = Post.query.get_or_404(post_id)
    
    # Check if user already liked this post
    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    
    if existing_like:
        db.session.delete(existing_like)
        liked = False
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
        liked = True
    
    db.session.commit()
    
    # Return the updated like count
    like_count = Like.query.filter_by(post_id=post_id).count()
    
    return jsonify({'liked': liked, 'likes_count': like_count})

@app.route('/comment/<int:post_id>', methods=['POST'])
@login_required
def add_comment(post_id):
    post = Post.query.get_or_404(post_id)
    content = request.form.get('content')
    
    if not content:
        return jsonify({'error': 'Comment cannot be empty'}), 400
    
    new_comment = Comment(
        content=content,
        user_id=current_user.id,
        post_id=post_id
    )
    
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'comment': {
            'content': new_comment.content,
            'author_name': current_user.name,
            'author_username': current_user.username,
            'profile_picture': url_for('static', filename=f'uploads/{current_user.profile_picture}'),
            'created_at': new_comment.created_at.strftime('%B %d, %Y at %H:%M')
        }
    })

@app.route('/search')
@login_required
def search():
    query = request.args.get('q', '')
    if not query:
        return render_template('search.html', users=[])
    
    users = User.query.filter(
        (User.name.ilike(f'%{query}%')) | (User.username.ilike(f'%{query}%'))
    ).all()
    
    return render_template('search.html', users=users, query=query)

if __name__ == '__main__':
    app.run(debug=True)
