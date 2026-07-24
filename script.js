gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

// Navbar: mobile hamburger menu
const menuToggle = document.querySelector('.menu-toggle');
const navLinksList = document.querySelector('.nav-links');

function closeMobileMenu() {
    if (!menuToggle || !navLinksList) return;
    navLinksList.classList.remove('mobile-open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
}

function closeAllDropdowns() {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
}

if (menuToggle && navLinksList) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinksList.classList.toggle('mobile-open');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        if (!isOpen) closeAllDropdowns();
    });

    // Tapping a direct link (Home / Team / Contact) closes the panel;
    // the nested "Games" links keep it open since they navigate away anyway
    navLinksList.querySelectorAll(':scope > li > a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Reset to the desktop layout if the viewport grows past the breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    });
}

// Navbar "Games" dropdown
const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    let closeTimeout;

    const openDropdown = () => {
        clearTimeout(closeTimeout);
        document.querySelectorAll('.nav-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.add('open');
    };

    const scheduleClose = () => {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(() => dropdown.classList.remove('open'), 200);
    };

    // Open on hover for mouse/trackpad users
    if (supportsHover) {
        dropdown.addEventListener('mouseenter', openDropdown);
        dropdown.addEventListener('mouseleave', scheduleClose);
    }

    // Click still works as a fallback (touch devices, keyboard/Enter activation)
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) dropdown.classList.add('open');
    });

    // Selection feedback: highlight the chosen game briefly before navigating
    dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.navigating) return;
            e.preventDefault();
            link.dataset.navigating = 'true';
            link.classList.add('selecting');
            const destination = link.getAttribute('href');
            setTimeout(() => {
                window.location.href = destination;
            }, 220);
        });
    });
});

document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
        if (!d.contains(e.target)) d.classList.remove('open');
    });

    if (
        navLinksList && navLinksList.classList.contains('mobile-open') &&
        !navLinksList.contains(e.target) &&
        !(menuToggle && menuToggle.contains(e.target))
    ) {
        closeMobileMenu();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllDropdowns();
        closeMobileMenu();
    }
});

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
//
// Each project picks ONE media source via `mediaType`:
//   - "video"        -> YouTube embed, read from `video` (embed URL)
//   - "local-video"  -> self-hosted <video>, read from `videoFile` (path to .mp4/.webm)
//   - "image"        -> static <img>, read from `image` (path to the image)
// Only the fields relevant to the chosen mediaType need to be filled in.
const projects = [
    {
        title: "Tears for Clavel",
        mediaType: "image",
        video: "",
        videoFile: "",
        image: "/Assets/keyArt_TearsForClavel.png",
        description: "Tears for Clavel is a singleplayer narrative murder mystery game where you play the same story from two different perspectives. As a night watchman during the dark and as a young mailman during the day, with a murder that ties everything together towards the end. It's set in a fictional 1940s post civil war Spain, with handrawn stylized art.",
        layout: "left",
        website: "#newsletter",
        linkText: "< IN DEVELOPMENT >",
        pageUrl: "games/tears-for-clavel.html"
    },
    {
        title: "Sereno",
        mediaType: "video",
        video: "https://www.youtube.com/embed/0XczhTgPNa8",
        videoFile: "",
        image: "",
        description: "Sereno was a gamejam prototype developed along 10 days that set the foundations for our\n" +
            "current title, Tears for Clavel. It was a narrative time-loop investigation game set in a fictional Madrid, where players play as Sereno, a night watchman trying to uncover the reason behind a murder.",
        layout: "right",
        website: "https://dreamy-alchemist.itch.io/sereno",
        linkText: "ENJOY IT NOW →",
        pageUrl: "games/sereno.html"
    }
];

// Both project CTA buttons read their destination from data-href (set/updated
// in animateProjectChange) instead of a real href, since they're <button>
// elements now. Resolved at click time - not cached - so it always matches
// whichever project is currently showing.
function handleProjectCtaClick(e) {
    const href = e.currentTarget.dataset.href;
    if (!href) return;

    if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
            gsap.to(window, { duration: 1, scrollTo: target, ease: 'power3.inOut' });
        }
    } else if (/^https?:\/\//.test(href)) {
        window.open(href, '_blank');
    } else {
        window.location.href = href;
    }
}

// Shows the right media element (iframe / local video / image) for a project
// inside its .video-container, hiding and resetting the other two so nothing
// keeps loading or playing silently in the background.
function setProjectMedia(container, project) {
    const iframeEl = container.querySelector('.project-media-video');
    const videoEl = container.querySelector('.project-media-local-video');
    const imgEl = container.querySelector('.project-media-image');

    videoEl.pause();
    iframeEl.src = '';
    videoEl.removeAttribute('src');
    imgEl.removeAttribute('src');
    [iframeEl, videoEl, imgEl].forEach(el => el.classList.remove('active'));

    if (project.mediaType === 'local-video') {
        videoEl.src = project.videoFile;
        videoEl.classList.add('active');
    } else if (project.mediaType === 'image') {
        imgEl.src = project.image;
        imgEl.alt = project.title;
        imgEl.classList.add('active');
    } else {
        iframeEl.src = project.video;
        iframeEl.classList.add('active');
    }
}

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
    const primaryBtn = document.getElementById('project-link');
    const secondaryBtn = document.getElementById('project-link-secondary');
    const ctaButtons = [primaryBtn, secondaryBtn].filter(Boolean);
    const project = projects[currentProject];

    // Animate the container and both CTA buttons together
    gsap.to([container, ...ctaButtons], {
        x: direction * -100,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
            // Update content
            container.setAttribute('data-layout', project.layout);
            setProjectMedia(container, project);
            container.querySelector('h2').textContent = project.title;
            container.querySelector('p').textContent = project.description;

            // Update the CTA buttons
            if (primaryBtn) {
                primaryBtn.textContent = project.linkText;
                primaryBtn.dataset.href = project.website;
            }
            if (secondaryBtn) {
                secondaryBtn.dataset.href = project.pageUrl;
            }

            // Reset position
            gsap.set([container, ...ctaButtons], { x: direction * 100 });

            // Animate in
            gsap.to([container, ...ctaButtons], {
                x: 0,
                opacity: 1,
                duration: 0.5,
                ease: 'power2.inOut',
                onComplete: () => {
                    // The fucking GSAP leaves an inline transform behind even at x:0,
                    // this shit outranks the .project-website:hover CSS transform so I
                    // clear it so the hover animation works again after switching.
                    gsap.set(ctaButtons, { clearProps: 'transform' });
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

// Initialize the first project's media, dots and CTA buttons
const initialProjectContainer = document.querySelector('.project-container');
if (initialProjectContainer) {
    setProjectMedia(initialProjectContainer, projects[currentProject]);
}
updateProjectDots();

const initialPrimaryBtn = document.getElementById('project-link');
const initialSecondaryBtn = document.getElementById('project-link-secondary');
if (initialPrimaryBtn) {
    initialPrimaryBtn.textContent = projects[currentProject].linkText;
    initialPrimaryBtn.dataset.href = projects[currentProject].website;
    initialPrimaryBtn.addEventListener('click', handleProjectCtaClick);
}
if (initialSecondaryBtn) {
    initialSecondaryBtn.dataset.href = projects[currentProject].pageUrl;
    initialSecondaryBtn.addEventListener('click', handleProjectCtaClick);
}

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
if (gallerySlider) {
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
}

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

function handleContact(e) {
    e.preventDefault();

    const email = document.getElementById('contact-form-email').value;
    const name = document.getElementById('contact-form-name').value;
    const subject = document.getElementById('contact-form-subject').value;
    const content = document.getElementById('contact-form-content').value;

    // Deshabilitar el botón mientras se envía
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const templateParams = {
        from_email: email,
        from_name: name,
        subject: subject,
        message: content
    };

    emailjs.send('service_6436xme', 'template_qtsvvtr', templateParams)
        .then(() => {
            alert('¡Mensaje enviado! Te contactaremos pronto.\n- Midnight Loop Team <3');
            e.target.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, (error) => {
            alert('Error al enviar el mensaje. Por favor, intenta de nuevo más tarde.');
            console.error('Error:', error);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });

    return false;
}

// Smooth scroll
// Any <a> whose href changes dynamically still gets the correct
// behaviour: smooth-scroll for "#..." targets, normal navigation for
// everything else. (The carousel's CTA buttons are <button> elements handled
// separately by handleProjectCtaClick, since they have no href attribute.)
document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('#') || href === '#') return;

    const target = document.querySelector(href);
    if (target) {
        e.preventDefault();
        gsap.to(window, {
            duration: 1,
            scrollTo: target,
            ease: 'power3.inOut'
        });
    }
});

// Scroll indicator functionality
const scrollIndicator = document.querySelector('.scroll-indicator');

if (scrollIndicator) {
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
            scrollTo: scrollIndicator.dataset.target || '#video',
            ease: 'power3.inOut'
        });
    });
}

// // Parallax effect on hero image
// const heroSection = document.querySelector('.hero');
// const heroImage = document.querySelector('.hero-content img');
// let isParallaxEnabled = window.innerWidth > 768;
//
// function resetHeroPosition(){
//     gsap.set(heroImage, { x: 0, y: 0 });
// }
//
// function handleParallax(e){
//     if(!isParallaxEnabled) return;
//    
//     const { clientX, clientY } = e;
//     const { offsetWidth, offsetHeight } = heroSection;
//    
//     const xPos = (clientX / offsetWidth - 0.5) * 2;
//     const yPos = (clientY / offsetHeight - 0.5) * 2;
//    
//     const moveX = xPos * 20;
//     const moveY = yPos * 20;
//    
//     gsap.to(heroImage, {
//         x: moveX,
//         y: moveY,
//         duration: 0.5,
//         ease: 'power2.out'
//     });
// }
//
// function handleParallaxLeave(){
//     if(!isParallaxEnabled) return;
//    
//     gsap.to(heroImage, {
//         x: 0, 
//         y: 0,
//         duration: 0.5,
//         ease: 'power2.out'
//     });
// }
//
// heroSection.addEventListener('mousemove', handleParallax);
// heroSection.addEventListener('mouseleave', handleParallaxLeave);
//
// window.addEventListener('resize', () => {
//     const wasEnabled = isParallaxEnabled;
//     isParallaxEnabled = window.innerWidth > 768;
//    
//     if(wasEnabled && !isParallaxEnabled){
//         resetHeroPosition();
//     }
// });