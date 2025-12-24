gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

// Navbar animation
gsap.from('.logo', {
    opacity: 0,
    x: -50,
    duration: 1,
    ease: 'power3.out'
});

// Scroll animations
gsap.utils.toArray('section').forEach(section => {
    // Select the children that are not arrows
    const targets = Array.from(section.children).filter(child => 
        !child.classList.contains('project-arrow')
    );
    
    if(targets.length > 0) {
        gsap.from(targets, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'top 20%',
                toggleActions: 'play none none reverse'
            }
        });
    }
});

// Project switching on carrousel functionality
const projects = [
    {
        title: "Sereno",
        video: "https://www.youtube.com/embed/0XczhTgPNa8",
        description: "Sereno is a narrative time-loop investigation game set in 1940s post-war Madrid, where players alternate between a watchman at night and a mailman during the day. Each loop represents a full day divided into four evolving stages, pushing players to explore the city, gather Items, develop Ideas, and build Instincts to uncover clues and reconstruct the truth behind a murder tied to both characters' pasts.",
        layout: "left",
        website: "https://dreamy-alchemist.itch.io/sereno",
        linkText: "DEMO COMING SOON →"
    },
    {
        title: "HAS SIDO RICKROLLEADO",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Jeje ejemplo.",
        layout: "right",
        website: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        linkText: "Picaste wei →"
    }
];

let currentProject = 0;
let isAnimatingProject = false;

function updateProjectDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentProject);
        dot.onclick = () => {
            if (index !== currentProject && !isAnimatingProject) {
                const direction = index > currentProject ? 1 : -1;
                currentProject = index;
                animateProjectChange(direction);
            }
        };
    });
}

function animateProjectChange(direction) {
    if (isAnimatingProject) return;
    isAnimatingProject = true;

    const container = document.querySelector('.project-container');
    const linkElement = document.getElementById('project-link');
    const project = projects[currentProject];

    // Animate the container and link
    gsap.to([container, linkElement], {
        x: direction * -100,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
            // Update content
            container.setAttribute('data-layout', project.layout);
            container.querySelector('iframe').src = project.video;
            container.querySelector('h2').textContent = project.title;
            container.querySelector('p').textContent = project.description;

            // Update project link
            linkElement.href = project.website;
            linkElement.textContent = project.linkText;

            // Reset position
            gsap.set([container, linkElement], { x: direction * 100 });

            // Animate in
            gsap.to([container, linkElement], {
                x: 0,
                opacity: 1,
                duration: 0.5,
                ease: 'power2.inOut',
                onComplete: () => {
                    isAnimatingProject = false;
                }
            });
        }
    });

    updateProjectDots();
}

function changeProject(direction) {
    if (isAnimatingProject) return;

    currentProject += direction;
    if (currentProject < 0) currentProject = projects.length - 1;
    if (currentProject >= projects.length) currentProject = 0;

    animateProjectChange(direction);
}

// Initialize dots
updateProjectDots();

// Gallery functionality
let currentSlide = 0;
const track = document.getElementById('galleryTrack');
const slides = document.querySelectorAll('.gallery-item');
let galleryInterval;
let isHoveringGallery = false;

function moveGallery(direction) {
    currentSlide += direction;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    if (currentSlide >= slides.length) currentSlide = 0;

    gsap.to(track, {
        x: -currentSlide * 100 + '%',
        duration: 0.5,
        ease: 'power2.inOut'
    });
}

function startGalleryAutoSlide() {
    galleryInterval = setInterval(() => {
        if (!isHoveringGallery) {
            moveGallery(1);
        }
    }, 3000);
}

function stopGalleryAutoSlide() {
    clearInterval(galleryInterval);
}

// Event listeners to pause on hover
const gallerySlider = document.querySelector('.gallery-slider');
gallerySlider.addEventListener('mouseenter', () => {
    isHoveringGallery = true;
    stopGalleryAutoSlide();
});

gallerySlider.addEventListener('mouseleave', () => {
    isHoveringGallery = false;
    startGalleryAutoSlide();
});

// Initiate auto-slide
startGalleryAutoSlide();

// Form handlers
function handleNewsletter(e) {
    e.preventDefault();
    
    const email = document.getElementById('newsletter-email').value;
    
    // URL de la encuesta
    // https://docs.google.com/forms/d/e/1FAIpQLSeJNtUh-DqaOC1e8t0uL45xhTxESu6Q27M1gwHNryuAAhXQhg/viewform?usp=header
    
    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSeJNtUh-DqaOC1e8t0uL45xhTxESu6Q27M1gwHNryuAAhXQhg/formResponse";
    
    const formData = new FormData();
    formData.append("entry.1973208529", email);

    fetch(formURL, {
        method: "POST",
        mode: "no-cors",
        body: formData
    }).then(() => {
        alert('¡Gracias por suscribirte! \n- Midnight Loop Team <3');
        e.target.reset();
    });
    
    return false;
}

/// TODO: Falta por hacer esta funcionalidad a la hora de mandar el correo en la sección de contacto
function handleContact(e) {
    e.preventDefault();
    alert('¡Mensaje enviado! Te contactaremos pronto. (Mentira)');
    e.target.reset();
    return false;
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: target,
                ease: 'power3.inOut'
            });
        }
    });
});

// Scroll indicator functionality
const scrollIndicator = document.querySelector('.scroll-indicator');

// Hide indicator on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        scrollIndicator.classList.add('hidden');
    } else {
        scrollIndicator.classList.remove('hidden');
    }
});

// Smooth scroll when clicking the arrow
scrollIndicator.addEventListener('click', () => {
    gsap.to(window, {
        duration: 1,
        scrollTo: '#video',
        ease: 'power3.inOut'
    });
});

// Parallax effect on hero image
const heroSection = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-content img');

heroSection.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { offsetWidth, offsetHeight } = heroSection;

    // Calculate mouse position as percentage
    const xPos = (clientX / offsetWidth - 0.5) * 2; // -1 to 1
    const yPos = (clientY / offsetHeight - 0.5) * 2; // -1 to 1

    // Apply parallax movement (subtle effect)
    const moveX = xPos * 20; // Max 20px movement
    const moveY = yPos * 20;

    gsap.to(heroImage, {
        x: moveX,
        y: moveY,
        duration: 0.5,
        ease: 'power2.out'
    });
});

// Reset position when mouse leaves
heroSection.addEventListener('mouseleave', () => {
    gsap.to(heroImage, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
    });
});