const annoucement = document.querySelector(
  ".announcement-bar-rotating .splide"
);

const splide = new Splide(annoucement, {
  type: "fade",
  rewind: true,
  focus: "center",
  perPage: 1,
  perMove: 1,
  pauseOnHover: false,
  pagination: false,
  autoplay: true,
  interval: delay,
  pauseOnHover: false,
  pauseOnFocus: false,
});

splide.mount();
