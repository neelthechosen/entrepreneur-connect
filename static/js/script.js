// Theme Toggle
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    
    // Set initial icon
    updateThemeIcon(currentTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            document.body.classList.add('theme-transition');
            
            // Save preference
            document.cookie = `theme=${newTheme}; path=/; max-age=31536000`; // 1 year
            
            updateThemeIcon(newTheme);
            
            // Remove transition class after animation
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 300);
        });
    }
    
    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill';
        }
    }

    // Initialize like buttons and event listeners
    initializeLikeButtons();
});

// Initialize like buttons with event listeners
function initializeLikeButtons() {
    // Add event listeners to all like buttons
    document.querySelectorAll('[id^="like-btn-"]').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.id.replace('like-btn-', '');
            likePost(postId);
        });
    });
}

// Like functionality
function likePost(postId) {
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeIcon = likeBtn.querySelector('i');
    const likeCount = document.getElementById(`like-count-${postId}`);
    
    // Show loading state
    likeBtn.disabled = true;
    const originalHTML = likeBtn.innerHTML;
    likeBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm"></i>';
    
    fetch(`/like/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Update like count
        if (likeCount) {
            likeCount.textContent = data.likes_count;
        }
        
        // Update like button appearance
        if (data.liked) {
            likeIcon.className = 'bi bi-heart-fill';
            likeBtn.classList.add('liked');
        } else {
            likeIcon.className = 'bi bi-heart';
            likeBtn.classList.remove('liked');
        }
        
        // Show feedback animation
        likeBtn.classList.add('pulse');
        setTimeout(() => {
            likeBtn.classList.remove('pulse');
        }, 600);
        
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error liking post', 'error');
        // Revert to original state
        likeBtn.innerHTML = originalHTML;
    })
    .finally(() => {
        likeBtn.disabled = false;
    });
}

// Comment functionality
function addComment(postId) {
    const contentInput = document.getElementById(`comment-content-${postId}`);
    const content = contentInput.value.trim();
    
    if (!content) {
        showToast('Please enter a comment', 'error');
        return;
    }
    
    const commentBtn = document.querySelector(`[onclick="addComment(${postId})"]`);
    const originalHTML = commentBtn.innerHTML;
    commentBtn.disabled = true;
    commentBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm"></i>';
    
    fetch(`/comment/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: `content=${encodeURIComponent(content)}`
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const commentsContainer = document.getElementById(`comments-${postId}`);
            const newComment = createCommentElement(data.comment);
            
            // Add the new comment at the top
            if (commentsContainer) {
                commentsContainer.insertBefore(newComment, commentsContainer.firstChild);
            }
            
            // Clear input
            contentInput.value = '';
            
            // Update comment count if it exists
            const commentCount = document.querySelector(`[href="${window.location.pathname}#comments"]`);
            if (commentCount) {
                const currentCount = parseInt(commentCount.textContent.match(/\d+/)[0]) || 0;
                commentCount.textContent = commentCount.textContent.replace(/\d+/, currentCount + 1);
            }
            
            showToast('Comment added successfully!', 'success');
        } else {
            showToast('Error adding comment', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error adding comment', 'error');
    })
    .finally(() => {
        commentBtn.disabled = false;
        commentBtn.innerHTML = originalHTML;
    });
}

function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'd-flex mb-3 comment-item';
    commentDiv.innerHTML = `
        <img src="${comment.profile_picture !== 'default_profile.png' ? 
            '/static/uploads/' + comment.profile_picture : 
            '/static/images/default_profile.png'}" 
            alt="${comment.username}" class="rounded-circle me-2 comment-img" 
            onerror="this.src='/static/images/default_profile.png'">
        <div class="flex-grow-1">
            <div class="bg-light rounded p-3">
                <strong>${comment.username}</strong>
                <p class="mb-0">${comment.content}</p>
                <small class="text-muted">${comment.created_at}</small>
            </div>
        </div>
    `;
    return commentDiv;
}

// Enhanced Toast notifications
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const iconClass = {
        'success': 'bi-check-circle',
        'error': 'bi-exclamation-circle',
        'info': 'bi-info-circle'
    }[type] || 'bi-info-circle';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${iconClass} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Image preview for file inputs
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    
    if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showToast('Please select a valid image file (JPEG, PNG, GIF)', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        
        reader.addEventListener('load', function() {
            preview.src = reader.result;
            preview.style.display = 'block';
        });
        
        reader.readAsDataURL(file);
    }
}

// Enhanced form handling
document.addEventListener('DOMContentLoaded', function() {
    // Add loading states to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm"></i> Processing...';
            }
        });
    });
    
    // Auto-focus comment inputs when comment button is clicked
    document.querySelectorAll('[href*="#comment"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const postId = this.getAttribute('href').split('-')[1];
            const commentInput = document.getElementById(`comment-content-${postId}`);
            if (commentInput) {
                setTimeout(() => commentInput.focus(), 100);
            }
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Add CSS for new animations
const style = document.createElement('style');
style.textContent = `
    .pulse {
        animation: pulse 0.6s ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .comment-item {
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .spinner-border-sm {
        width: 1rem;
        height: 1rem;
    }
`;
document.head.appendChild(style);
