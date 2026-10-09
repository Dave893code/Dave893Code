const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navAnchors = document.querySelectorAll(".nav-links a");
const revealElements = document.querySelectorAll(".reveal");
const yearEl = document.getElementById("year");
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const CONTACT_PROVIDER = "emailjs"; // "emailjs" or "formspree"
const EMAILJS_CONFIG = {
  publicKey: "JZQLdU77UQXq0xvTa",
  serviceId: "service_9lqlk5k",
  templateId: "template_w2xwjxv",
};
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORMSPREE_FORM_ID";
const RECAPTCHA_SITE_KEY = "6LcP278sAAAAAG5rH3TClAMWxLd03jT40huflqrn";
const RECAPTCHA_ACTION = "CONTACT_FORM"; // Action to track in reCAPTCHA dashboard

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    navLinks.classList.toggle("open");
  });

  navAnchors.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealOnScroll = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealOnScroll.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
);

revealElements.forEach((el) => revealOnScroll.observe(el));

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      formStatus.textContent = "Please fill in all required fields correctly.";
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || "Send Message";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";
    }

    formStatus.textContent = "Verifying with security check...";

    try {
      // Generate reCAPTCHA token
      if (!window.grecaptcha) {
        throw new Error(
          "reCAPTCHA failed to load. Please refresh and try again.",
        );
      }

      // Wrap grecaptcha.ready in a Promise for proper async handling
      const recaptchaToken = await new Promise((resolve, reject) => {
        grecaptcha.enterprise.ready(async () => {
          try {
            const token = await grecaptcha.enterprise.execute(
              RECAPTCHA_SITE_KEY,
              { action: RECAPTCHA_ACTION },
            );
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });

      document.getElementById("recaptchaToken").value = recaptchaToken;

      if (submitBtn) {
        submitBtn.textContent = "Sending...";
      }
      formStatus.textContent = "Sending your message...";

      // Send form with token

      if (CONTACT_PROVIDER === "emailjs") {
        const hasMissingEmailJsConfig =
          EMAILJS_CONFIG.publicKey.includes("YOUR_") ||
          EMAILJS_CONFIG.serviceId.includes("YOUR_") ||
          EMAILJS_CONFIG.templateId.includes("YOUR_");

        if (hasMissingEmailJsConfig) {
          throw new Error(
            "EmailJS is not configured yet. Add your public key, service ID, and template ID in david.js.",
          );
        }

        if (!window.emailjs) {
          throw new Error(
            "EmailJS SDK failed to load. Check your internet connection and try again.",
          );
        }

        window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
        await window.emailjs.sendForm(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          contactForm,
        );
      } else if (CONTACT_PROVIDER === "formspree") {
        if (FORMSPREE_ENDPOINT.includes("YOUR_FORMSPREE_FORM_ID")) {
          throw new Error(
            "Formspree is not configured yet. Add your Formspree form ID in david.js.",
          );
        }

        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: new FormData(contactForm),
        });

        if (!response.ok) {
          throw new Error(
            "Formspree could not send your message. Please try again.",
          );
        }
      } else {
        throw new Error(
          "Unsupported contact provider. Use 'emailjs' or 'formspree'.",
        );
      }

      const name = document.getElementById("name")?.value.trim() || "there";
      formStatus.textContent = `Thanks ${name}, your message has been sent successfully.`;
      contactForm.reset();
      document.getElementById("recaptchaToken").value = "";
    } catch (error) {
      formStatus.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}
