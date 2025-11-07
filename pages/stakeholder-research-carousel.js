import Carousel from '../pages/carousel.js';

// Only initialize carousel if the element exists
const carouselElement = document.querySelector('.carousel');
if (carouselElement) {
  new Carousel({
    target: carouselElement,
    items: [
      {
        image: "../assets/stakeholder_research/carousel-1.png"
      },
      {
        image: "../assets/stakeholder_research/carousel-2.png"
      },
      {
        image: "../assets/stakeholder_research/carousel-3.png"
      },
      {
        image: "../assets/stakeholder_research/carousel-4.png"
      },
      {
        image: "../assets/stakeholder_research/carousel-51.png"
      },
      {
        image: "../assets/stakeholder_research/carousel-6.png"
      }
    ]
  });
}