// General JavaScript for the application

// Handle comment submission
document.addEventListener('DOMContentLoaded', function() {
    const commentForms = document.querySelectorAll('.comment-form');
    
    commentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const postId = this.dataset.postId;
            
            fetch(`/comment/${postId}`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add the new comment to the list
                    const commentsList = document.querySelector(`.comments-list[data-post-id="${postId}"]`);
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment mb-3';
                    commentElement.innerHTML = `
                        <div class="d-flex align-items-center mb-1">
                            <img src="${data.comment.profile_picture}" class="rounded-circle me-2" width="30" height="30">
                            <strong>${data.comment.author_name}</strong>
                            <small class="text-muted ms-2">${data.comment.created_at}</small>
                        </div>
                        <p class="mb-0">${data.comment.content}</p>
                    `;
                    commentsList.appendChild(commentElement);
                    
                    // Clear the form
                    this.reset();
                }
            });
        });
    });
});
