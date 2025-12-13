const toggle = document.getElementById("dark-mode-toggle");

toggle.addEventListener("click", () => {
  document.body.classList.toggle("latex-dark");
  
  // Save preference to localStorage
  if (document.body.classList.contains("latex-dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});

// Load saved theme preference on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("latex-dark");
  }
});



// Section reveal on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});

document.querySelectorAll("section").forEach(s => observer.observe(s));

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".animate-text").forEach(el => {
    const text = el.textContent;
    el.textContent = "";

    [...text].forEach(char => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      el.appendChild(span);
    });

    anime({
      targets: el.querySelectorAll("span"),
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(100),
      duration: 1000,
      easing: "easeOutQuad"
    });
  });
});