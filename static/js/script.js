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
document.addEventListener('DOMContentLoaded', function() {
    // Enable tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Handle like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.querySelector('i').classList.toggle('bi-heart');
            this.querySelector('i').classList.toggle('bi-heart-fill');
            this.classList.toggle('active');
        });
    });
    
    // Handle comment input
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('input', function() {
            const postId = this.dataset.postId;
            const submitBtn = document.querySelector(`.comment-submit[data-post-id="${postId}"]`);
            submitBtn.disabled = this.value.trim() === '';
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const postId = this.dataset.postId;
                document.querySelector(`.comment-submit[data-post-id="${postId}"]`).click();
            }
        });
    });
});
