// Theme functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle button
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    function updateThemeIcon(theme) {
        const lightIcon = document.querySelector('[data-theme-icon="light"]');
        const darkIcon = document.querySelector('[data-theme-icon="dark"]');
        
        if (theme === 'light') {
            lightIcon.classList.remove('d-none');
            darkIcon.classList.add('d-none');
        } else {
            lightIcon.classList.add('d-none');
            darkIcon.classList.remove('d-none');
        }
    }
    
    // Share functionality
    function sharePost(postId, platform) {
        const postUrl = `${window.location.origin}/post/${postId}`;
        let shareUrl;
        
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this post: ${postUrl}`)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Check out this post&body=Check out this post: ${postUrl}`;
                break;
            default:
                // Copy to clipboard as fallback
                navigator.clipboard.writeText(postUrl).then(() => {
                    showToast('Link copied to clipboard!');
                });
                return;
        }
        
        window.open(shareUrl, '_blank');
    }

    function showToast(message) {
        // Create toast if it doesn't exist
        if (!document.getElementById('shareToast')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.innerHTML = `
                <div id="shareToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-body">
                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                        <span id="toastMessage">${message}</span>
                    </div>
                </div>
            `;
            document.body.appendChild(toastContainer);
        } else {
            document.getElementById('toastMessage').textContent = message;
        }
        
        // Show toast
        const toast = new bootstrap.Toast(document.getElementById('shareToast'));
        toast.show();
    }

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Handle like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.dataset.postId;
            const icon = this.querySelector('i');
            
            fetch(`/like/${postId}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                const likeCount = document.querySelector(`.like-count[data-post-id="${postId}"]`);
                
                if (data.liked) {
                    icon.classList.remove('bi-heart');
                    icon.classList.add('bi-heart-fill');
                    this.classList.add('active');
                    icon.classList.add('like-animation');
                    setTimeout(() => icon.classList.remove('like-animation'), 500);
                } else {
                    icon.classList.remove('bi-heart-fill');
                    icon.classList.add('bi-heart');
                    this.classList.remove('active');
                }
                
                if (likeCount) {
                    likeCount.textContent = data.likes_count;
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });
    
    // Handle comment input
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('input', function() {
            const postId = this.dataset.postId;
            const submitBtn = document.querySelector(`.comment-submit[data-post-id="${postId}"]`);
            submitBtn.disabled = this.value.trim() === '';
            submitBtn.classList.toggle('active', this.value.trim() !== '');
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const postId = this.dataset.postId;
                addComment(postId, this);
            }
        });
    });
    
    // Handle comment submit buttons
    document.querySelectorAll('.comment-submit').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.dataset.postId;
            const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
            addComment(postId, input);
        });
    });
    
    function addComment(postId, inputElement) {
        const content = inputElement.value.trim();
        if (!content) return;
        
        const formData = new FormData();
        formData.append('content', content);
        
        fetch(`/comment/${postId}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                inputElement.value = '';
                const submitButton = document.querySelector(`.comment-submit[data-post-id="${postId}"]`);
                submitButton.disabled = true;
                submitButton.classList.remove('active');
                
                // Reload the page to show the new comment
                location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    // Copy post link functionality
    window.copyPostLink = function(postId) {
        const postUrl = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            showToast('Post link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };
});
