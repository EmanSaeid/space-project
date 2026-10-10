/* =========================================================
   COSMOS - Space Dashboard
   JavaScript for the supplied HTML
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ---------- API endpoints ----------
  const NASA_API_KEY = "DEMO_KEY";
  const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";

  const LAUNCHES_API_URL =
    "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=detailed";

  const PLANETS_API_URL =
    "https://api.le-systeme-solaire.net/rest/bodies/?filter%5B%5D=isPlanet%2Ceq%2Ctrue";

  // ---------- Small helpers ----------
  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const formatDate = (dateString, options = {}) => {
    if (!dateString) return "Date unavailable";

    const date = new Date(
      dateString.length === 10
        ? `${dateString}T00:00:00`
        : dateString
    );

    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    }).format(date);
  };

  const formatNumber = (value, digits = 2) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString("en-US", {
          maximumFractionDigits: digits,
        })
      : "N/A";
  };

  async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return response.json();
  }

  function showMessage(
    container,
    message,
    icon = "fa-circle-info"
  ) {
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full text-center text-slate-400 py-10">
        <i class="fas ${icon} text-3xl mb-3 text-blue-400"></i>
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  }

  // ---------- Sidebar navigation ----------
  const sections = $$(".app-section");
  const navLinks = $$(".nav-link");
  const sidebar = $("#sidebar");
  const sidebarToggle = $("#sidebar-toggle");

  function showSection(sectionId) {
    const target = document.getElementById(sectionId);

    if (
      !target ||
      !target.classList.contains("app-section")
    ) {
      return;
    }

    sections.forEach((section) => {
      section.classList.toggle(
        "hidden",
        section.id !== sectionId
      );
    });

    navLinks.forEach((link) => {
      const active = link.dataset.section === sectionId;

      link.classList.toggle("bg-blue-500/10", active);
      link.classList.toggle("text-blue-400", active);
      link.classList.toggle("text-slate-300", !active);
    });

    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.add("-translate-x-full");
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showSection(link.dataset.section);
    });
  });

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }

  // ---------- Today in Space / NASA APOD ----------
  const apodImage = $("#apod-image");
  const apodTitle = $("#apod-title");
  const apodExplanation = $("#apod-explanation");
  const apodDate = $("#apod-date");
  const apodDateDetail = $("#apod-date-detail");
  const apodDateInfo = $("#apod-date-info");
  const apodCopyright = $("#apod-copyright");
  const apodMediaType = $("#apod-media-type");
  const apodDateInput = $("#apod-date-input");
  const apodLoading = $("#apod-loading");
  const apodImageContainer = $("#apod-image-container");
  const loadDateButton = $("#load-date-btn");
  const todayButton = $("#today-apod-btn");

  const todayISO = new Date().toISOString().slice(0, 10);

  if (apodDateInput) {
    apodDateInput.max = todayISO;

    if (
      !apodDateInput.value ||
      apodDateInput.value > todayISO
    ) {
      apodDateInput.value = todayISO;
    }
  }

  async function loadAPOD(date = todayISO) {
    if (!apodImage) return;

    if (date > todayISO) {
      alert("Please choose today or an earlier date.");
      return;
    }

    if (apodLoading) {
      apodLoading.classList.remove("hidden");
    }

    if (loadDateButton) {
      loadDateButton.disabled = true;
      loadDateButton.classList.add("opacity-50");
    }

    try {
      const url =
        `${NASA_APOD_URL}?api_key=${encodeURIComponent(NASA_API_KEY)}` +
        `&date=${encodeURIComponent(date)}`;

      const data = await fetchJSON(url);

      if (data.media_type === "image") {
        apodImage.src = data.hdurl || data.url;
        apodImage.alt =
          data.title || "NASA Astronomy Picture of the Day";

        apodImage.classList.remove("hidden");
      } else {
        apodImage.src = "./assets/images/placeholder.webp";
        apodImage.alt = "Astronomy media";
      }

      if (apodTitle) {
        apodTitle.textContent =
          data.title || "Astronomy Picture of the Day";
      }

      if (apodExplanation) {
        apodExplanation.textContent =
          data.explanation || "No description is available.";
      }

      if (apodDate) {
        apodDate.textContent =
          `Astronomy Picture of the Day - ${
            formatDate(data.date, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          }`;
      }

      if (apodDateDetail) {
        apodDateDetail.innerHTML =
          `<i class="far fa-calendar mr-2"></i>${
            escapeHTML(data.date || date)
          }`;
      }

      if (apodDateInfo) {
        apodDateInfo.textContent = data.date || date;
      }

      if (apodCopyright) {
        apodCopyright.textContent = data.copyright
          ? `© ${data.copyright}`
          : "© NASA";
      }

      if (apodMediaType) {
        apodMediaType.textContent =
          data.media_type === "image" ? "Image" : "Video";
      }

      if (apodDateInput) {
        apodDateInput.value = data.date || date;
      }

      const fullResolutionButton =
        $("button", apodImageContainer);

      if (fullResolutionButton) {
        fullResolutionButton.onclick = () => {
          const mediaUrl = data.hdurl || data.url;

          if (mediaUrl) {
            window.open(
              mediaUrl,
              "_blank",
              "noopener,noreferrer"
            );
          }
        };

        fullResolutionButton.disabled =
          data.media_type !== "image";

        fullResolutionButton.classList.toggle(
          "opacity-50",
          data.media_type !== "image"
        );
      }
    } catch (error) {
      console.error("NASA APOD error:", error);

      if (apodTitle) {
        apodTitle.textContent =
          "Unable to load today's space image";
      }

      if (apodExplanation) {
        apodExplanation.textContent =
          "We couldn't retrieve data from NASA. Please check your internet connection and try again. NASA DEMO_KEY also has request limits.";
      }
    } finally {
      if (apodLoading) {
        apodLoading.classList.add("hidden");
      }

      if (loadDateButton) {
        loadDateButton.disabled = false;
        loadDateButton.classList.remove("opacity-50");
      }
    }
  }

  loadDateButton?.addEventListener("click", () => {
    const selectedDate = apodDateInput?.value;

    if (!selectedDate) {
      alert("Please choose a date first.");
      return;
    }

    loadAPOD(selectedDate);
  });

  todayButton?.addEventListener("click", () => {
    loadAPOD(todayISO);
  });

  apodDateInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loadAPOD(apodDateInput.value);
    }
  });  // ---------- Upcoming launches / The Space Devs ----------
  const launchesGrid = $("#launches-grid");
  const featuredLaunch = $("#featured-launch");
  const launchesCount = $("#launches-count");
  const launchesCountMobile = $("#launches-count-mobile");
  const favoritesKey = "cosmos-launch-favorites";

  function getLaunchFavorites() {
    try {
      return JSON.parse(
        localStorage.getItem(favoritesKey) || "[]"
      );
    } catch {
      return [];
    }
  }

  function toggleLaunchFavorite(launchId) {
    const favorites = getLaunchFavorites();

    const next = favorites.includes(launchId)
      ? favorites.filter((id) => id !== launchId)
      : [...favorites, launchId];

    localStorage.setItem(
      favoritesKey,
      JSON.stringify(next)
    );

    return next.includes(launchId);
  }

  function launchStatus(launch) {
    return (
      launch.status?.abbrev ||
      launch.status?.name ||
      "TBD"
    );
  }

  function launchLocation(launch) {
    return (
      launch.pad?.name ||
      launch.pad?.location?.name ||
      launch.launch_service_provider?.name ||
      "Location unavailable"
    );
  }

  function launchImage(launch) {
    return launch.image || launch.infographic || "";
  }

  function renderLaunchCard(launch) {
    const id = launch.id || launch.url || launch.name;
    const favorite = getLaunchFavorites().includes(id);
    const image = launchImage(launch);

    const provider =
      launch.launch_service_provider?.name ||
      "Unknown provider";

    const rocket =
      launch.rocket?.configuration?.full_name ||
      launch.rocket?.configuration?.name ||
      "Rocket details unavailable";

    const date = launch.net || launch.window_start;
    const status = launchStatus(launch);

    const statusColor = /go|success/i.test(status)
      ? "bg-green-500/90"
      : /tbd|tbc|hold|tentative/i.test(status)
        ? "bg-yellow-500/90"
        : "bg-blue-500/90";

    return `
      <article class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">

        <div class="relative h-48 bg-slate-900/50 flex items-center justify-center overflow-hidden">

          ${
            image
              ? `<img
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(launch.name || "Rocket launch")}"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  onerror="this.remove()"
                >`
              : `<i class="fas fa-rocket text-5xl text-slate-700"></i>`
          }

          <span class="absolute top-3 right-3 px-3 py-1 ${statusColor} text-white rounded-full text-xs font-semibold">
            ${escapeHTML(status)}
          </span>

        </div>

        <div class="p-5">

          <div class="mb-3">
            <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              ${escapeHTML(launch.name || "Unnamed launch")}
            </h4>

            <p class="text-sm text-slate-400 flex items-center gap-2">
              <i class="fas fa-building text-xs"></i>
              ${escapeHTML(provider)}
            </p>
          </div>

          <div class="space-y-2 mb-4">

            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-calendar text-slate-500 w-4"></i>
              <span class="text-slate-300">
                ${escapeHTML(
                  formatDate(date, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                )}
              </span>
            </div>

            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-clock text-slate-500 w-4"></i>
              <span class="text-slate-300">
                ${
                  escapeHTML(
                    date
                      ? new Date(date).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          }
                        ) + " UTC"
                      : "TBD"
                  )
                }
              </span>
            </div>

            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-rocket text-slate-500 w-4"></i>
              <span class="text-slate-300">
                ${escapeHTML(rocket)}
              </span>
            </div>

            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
              <span class="text-slate-300 line-clamp-1">
                ${escapeHTML(launchLocation(launch))}
              </span>
            </div>

          </div>

          <div class="flex items-center gap-2 pt-4 border-t border-slate-700">

            <button
              type="button"
              class="launch-details flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold"
              data-launch-id="${escapeHTML(id)}"
            >
              Details
            </button>

            <button
              type="button"
              class="launch-favorite px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              data-launch-id="${escapeHTML(id)}"
              aria-label="Toggle favorite"
              aria-pressed="${favorite}"
            >
              <i class="${favorite ? "fas text-pink-400" : "far"} fa-heart"></i>
            </button>

          </div>

        </div>
      </article>
    `;
  }

  function renderFeaturedLaunch(launch) {
    if (!featuredLaunch) return;

    const date = launch.net || launch.window_start;

    const provider =
      launch.launch_service_provider?.name ||
      "Unknown provider";

    const rocket =
      launch.rocket?.configuration?.full_name ||
      launch.rocket?.configuration?.name ||
      "Rocket details unavailable";

    const image = launchImage(launch);

    const description =
      launch.mission?.description ||
      launch.mission?.name ||
      "Mission information has not been provided by the launch data source.";

    const days = date
      ? Math.max(
          0,
          Math.ceil(
            (new Date(date).getTime() - Date.now()) /
              86400000
          )
        )
      : null;

    featuredLaunch.innerHTML = `
      <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">

        <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">

          <div class="flex flex-col justify-between">
            <div>

              <div class="flex items-center gap-3 mb-4 flex-wrap">
                <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                  <i class="fas fa-star mr-2"></i>
                  Featured Launch
                </span>

                <span class="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                  ${escapeHTML(launchStatus(launch))}
                </span>
              </div>

              <h3 class="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                ${escapeHTML(launch.name || "Upcoming launch")}
              </h3>

              <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
                <div class="flex items-center gap-2">
                  <i class="fas fa-building"></i>
                  <span>${escapeHTML(provider)}</span>
                </div>

                <div class="flex items-center gap-2">
                  <i class="fas fa-rocket"></i>
                  <span>${escapeHTML(rocket)}</span>
                </div>
              </div>

              <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
                <i class="fas fa-clock text-2xl text-blue-400"></i>

                <div>
                  <p class="text-2xl font-bold text-blue-400">
                    ${days === null ? "TBD" : days}
                  </p>
                  <p class="text-xs text-slate-400">
                    Days Until Launch
                  </p>
                </div>
              </div>

              <div class="grid xl:grid-cols-2 gap-4 mb-6">

                <div class="bg-slate-900/50 rounded-xl p-4">
                  <p class="text-xs text-slate-400 mb-1">
                    <i class="fas fa-calendar mr-2"></i>
                    Launch Date
                  </p>
                  <p class="font-semibold">
                    ${escapeHTML(
                      formatDate(date, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    )}
                  </p>
                </div>

                <div class="bg-slate-900/50 rounded-xl p-4">
                  <p class="text-xs text-slate-400 mb-1">
                    <i class="fas fa-clock mr-2"></i>
                    Launch Time
                  </p>
                  <p class="font-semibold">
                    ${
                      escapeHTML(
                        date
                          ? new Date(date).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "UTC",
                              }
                            ) + " UTC"
                          : "TBD"
                      )
                    }
                  </p>
                </div>

                <div class="bg-slate-900/50 rounded-xl p-4">
                  <p class="text-xs text-slate-400 mb-1">
                    <i class="fas fa-map-marker-alt mr-2"></i>
                    Location
                  </p>
                  <p class="font-semibold text-sm">
                    ${escapeHTML(launchLocation(launch))}
                  </p>
                </div>

                <div class="bg-slate-900/50 rounded-xl p-4">
                  <p class="text-xs text-slate-400 mb-1">
                    <i class="fas fa-globe mr-2"></i>
                    Country
                  </p>
                  <p class="font-semibold">
                    ${escapeHTML(
                      launch.pad?.location?.country?.name ||
                        "Unknown"
                    )}
                  </p>
                </div>

              </div>

              <p class="text-slate-300 leading-relaxed mb-6">
                ${escapeHTML(description)}
              </p>

            </div>

            <div class="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                id="featured-launch-details"
                class="px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <i class="fas fa-info-circle"></i>
                View Full Details
              </button>
            </div>
          </div>

          <div class="relative">
            <div class="relative h-full min-h-[300px] lg:min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50 flex items-center justify-center">

              ${
                image
                  ? `<img
                      src="${escapeHTML(image)}"
                      alt="${escapeHTML(launch.name || "Launch vehicle")}"
                      class="w-full h-full object-cover absolute inset-0"
                      loading="lazy"
                      onerror="this.remove()"
                    >`
                  : `<i class="fas fa-rocket text-9xl text-slate-700/50"></i>`
              }

              <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
            </div>
          </div>

        </div>
      </div>
    `;

    $("#featured-launch-details")?.addEventListener(
      "click",
      () => {
        if (launch.url) {
          window.open(
            launch.url,
            "_blank",
            "noopener,noreferrer"
          );
        } else {
          alert(description);
        }
      }
    );
  }

  async function loadLaunches() {
    if (!launchesGrid) return;

    showMessage(
      launchesGrid,
      "Loading upcoming launches...",
      "fa-spinner fa-spin"
    );

    try {
      const data = await fetchJSON(LAUNCHES_API_URL);

      const launches = (data.results || [])
        .filter((launch) => {
          const date = launch.net || launch.window_start;

          return (
            !date ||
            new Date(date).getTime() >= Date.now() - 3600000
          );
        })
        .sort(
          (a, b) =>
            new Date(a.net || a.window_start || 0) -
            new Date(b.net || b.window_start || 0)
        );

      if (!launches.length) {
        showMessage(
          launchesGrid,
          "No upcoming launches were returned by the API."
        );

        if (featuredLaunch) {
          featuredLaunch.innerHTML = "";
        }

        return;
      }

      if (launchesCount) {
        launchesCount.textContent =
          `${launches.length} Launches`;
      }

      if (launchesCountMobile) {
        launchesCountMobile.textContent =
          String(launches.length);
      }

      renderFeaturedLaunch(launches[0]);

      launchesGrid.innerHTML =
        launches.map(renderLaunchCard).join("");

      launchesGrid.addEventListener(
        "click",
        (event) => {
          const favoriteButton =
            event.target.closest(".launch-favorite");

          if (favoriteButton) {
            const isFavorite = toggleLaunchFavorite(
              favoriteButton.dataset.launchId
            );

            favoriteButton.setAttribute(
              "aria-pressed",
              String(isFavorite)
            );

            favoriteButton.innerHTML = `
              <i class="${
                isFavorite ? "fas text-pink-400" : "far"
              } fa-heart"></i>
            `;

            return;
          }

          const detailsButton =
            event.target.closest(".launch-details");

          if (detailsButton) {
            const launch = launches.find(
              (item) =>
                (item.id || item.url || item.name) ===
                detailsButton.dataset.launchId
            );

            if (launch?.url) {
              window.open(
                launch.url,
                "_blank",
                "noopener,noreferrer"
              );
            } else {
              alert(
                launch?.mission?.description ||
                  "No additional details are available."
              );
            }
          }
        },
        { once: true }
      );
    } catch (error) {
      console.error("Launches API error:", error);

      showMessage(
        launchesGrid,
        "Unable to load launches. The SpaceDevs API may be temporarily unavailable or rate-limited. Please try again later.",
        "fa-triangle-exclamation"
      );
    }
  }
    // ---------- Planets / Solar System OpenData ----------
  const planetsGrid = $("#planets-grid");
  const planetImage = $("#planet-detail-image");
  const planetName = $("#planet-detail-name");
  const planetDescription = $("#planet-detail-description");

  // Local images for the eight planets
  const planetImages = {
    mercury: "./assets/images/mercury.png",
    venus: "./assets/images/venus.png",
    earth: "./assets/images/earth.png",
    mars: "./assets/images/mars.png",
    jupiter: "./assets/images/jupiter.png",
    saturn: "./assets/images/saturn.png",
    uranus: "./assets/images/uranus.png",
    neptune: "./assets/images/neptune.png",
  };

  const planetColors = {
    mercury: "#eab308",
    venus: "#f97316",
    earth: "#3b82f6",
    mars: "#ef4444",
    jupiter: "#fb923c",
    saturn: "#facc15",
    uranus: "#06b6d4",
    neptune: "#2563eb",
  };

  const planetText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  };

  const AU_TO_KM = 149597870.7;

  function planetMass(planet) {
    if (
      !planet.mass ||
      planet.mass.massValue == null ||
      planet.mass.massExponent == null
    ) {
      return "N/A";
    }

    const kilograms =
      Number(planet.mass.massValue) *
      Math.pow(10, Number(planet.mass.massExponent));

    return `${kilograms.toExponential(3)} kg`;
  }

  function planetVolume(planet) {
    if (
      !planet.vol ||
      planet.vol.volValue == null ||
      planet.vol.volExponent == null
    ) {
      return "N/A";
    }

    const volume =
      Number(planet.vol.volValue) *
      Math.pow(10, Number(planet.vol.volExponent));

    return `${volume.toExponential(3)} km³`;
  }

  function planetDescriptionText(planet) {
    const name = planet.englishName || planet.name;

    const distance = planet.semimajorAxis
      ? `${formatNumber(
          planet.semimajorAxis / AU_TO_KM,
          2
        )} AU from the Sun`
      : "in our Solar System";

    const moons = Array.isArray(planet.moons)
      ? planet.moons.length
      : 0;

    return `${name} is a ${
      String(planet.bodyType || "planet").toLowerCase()
    } in our Solar System, located approximately ${distance}. It has a mean radius of ${formatNumber(
      planet.meanRadius,
      0
    )} km and ${moons} known moon${moons === 1 ? "" : "s"}.`;
  }

  function showPlanetDetails(planet) {
    const name = planet.englishName || planet.name;
    const id = String(planet.id || name).toLowerCase();

    // Show the local image for the selected planet
    if (planetImage) {
      planetImage.src =
        planetImages[id] || planetImages.earth;

      planetImage.alt = `${name} planet`;
    }

    if (planetName) {
      planetName.textContent = name;
    }

    if (planetDescription) {
      planetDescription.textContent =
        planetDescriptionText(planet);
    }

    const distanceAU =
      Number(planet.semimajorAxis) / AU_TO_KM;

    planetText(
      "planet-distance",
      Number.isFinite(distanceAU)
        ? `${formatNumber(distanceAU, 2)} AU (${formatNumber(
            planet.semimajorAxis,
            0
          )} km)`
        : "N/A"
    );

    planetText(
      "planet-radius",
      Number.isFinite(planet.meanRadius)
        ? `${formatNumber(planet.meanRadius, 0)} km`
        : "N/A"
    );

    planetText("planet-mass", planetMass(planet));

    planetText(
      "planet-density",
      Number.isFinite(planet.density)
        ? `${formatNumber(planet.density, 2)} g/cm³`
        : "N/A"
    );

    planetText(
      "planet-orbital-period",
      Number.isFinite(planet.sideralOrbit)
        ? `${formatNumber(planet.sideralOrbit, 2)} days`
        : "N/A"
    );

    planetText(
      "planet-rotation",
      Number.isFinite(planet.sideralRotation)
        ? `${formatNumber(planet.sideralRotation, 2)} hours`
        : "N/A"
    );

    planetText(
      "planet-moons",
      Array.isArray(planet.moons)
        ? String(planet.moons.length)
        : "0"
    );

    planetText(
      "planet-gravity",
      Number.isFinite(planet.gravity)
        ? `${formatNumber(planet.gravity, 2)} m/s²`
        : "N/A"
    );

    planetText(
      "planet-discoverer",
      planet.discoveredBy ||
        ([
          "earth",
          "mercury",
          "venus",
          "mars",
          "jupiter",
          "saturn",
        ].includes(id)
          ? "Known since antiquity"
          : "N/A")
    );

    planetText(
      "planet-discovery-date",
      planet.discoveryDate || "N/A"
    );

    planetText(
      "planet-body-type",
      planet.bodyType || "Planet"
    );

    planetText("planet-volume", planetVolume(planet));

    planetText(
      "planet-perihelion",
      Number.isFinite(planet.perihelion)
        ? `${formatNumber(planet.perihelion, 0)} km`
        : "N/A"
    );

    planetText(
      "planet-aphelion",
      Number.isFinite(planet.aphelion)
        ? `${formatNumber(planet.aphelion, 0)} km`
        : "N/A"
    );

    planetText(
      "planet-eccentricity",
      Number.isFinite(planet.eccentricity)
        ? formatNumber(planet.eccentricity, 5)
        : "N/A"
    );

    planetText(
      "planet-inclination",
      Number.isFinite(planet.inclination)
        ? `${formatNumber(planet.inclination, 2)}°`
        : "N/A"
    );

    planetText(
      "planet-axial-tilt",
      Number.isFinite(planet.axialTilt)
        ? `${formatNumber(planet.axialTilt, 2)}°`
        : "N/A"
    );

    planetText(
      "planet-temp",
      Number.isFinite(planet.avgTemp)
        ? `${formatNumber(planet.avgTemp - 273.15, 1)} °C`
        : "N/A"
    );

    planetText(
      "planet-escape",
      Number.isFinite(planet.escape)
        ? `${formatNumber(planet.escape / 1000, 2)} km/s`
        : "N/A"
    );

    // Highlight the selected planet card
    $$(".planet-card").forEach((card) => {
      const active = card.dataset.planetId === id;

      card.classList.toggle("ring", active);

      card.style.borderColor = active
        ? planetColors[id] || "#3b82f6"
        : "";
    });
  }

  function updatePlanetCards(planets) {
    if (!planetsGrid) return;

    planets.forEach((planet) => {
      const id = String(
        planet.id || planet.englishName || ""
      ).toLowerCase();

      const card = $(
        `[data-planet-id="${id}"]`,
        planetsGrid
      );

      if (!card) return;

      const name = planet.englishName || planet.name;
      const title = $("h4", card);
      const distance = $("p", card);

      if (title) {
        title.textContent = name;
      }

      if (distance) {
        const au =
          Number(planet.semimajorAxis) / AU_TO_KM;

        distance.textContent = Number.isFinite(au)
          ? `${formatNumber(au, 2)} AU`
          : "Distance N/A";
      }
    });
  }  // ---------- Planet comparison table ----------
  function updateComparisonTable(planets) {
    const tbody = $("#planet-comparison-tbody");

    if (!tbody) return;

    tbody.innerHTML = planets.map((planet) => {
      const id = String(
        planet.id || planet.englishName || ""
      ).toLowerCase();

      const name = planet.englishName || planet.name;
      const au = Number(planet.semimajorAxis) / AU_TO_KM;

      const orbitalPeriod = Number.isFinite(planet.sideralOrbit)
        ? `${formatNumber(planet.sideralOrbit, 1)} days`
        : "N/A";

      const moons = Array.isArray(planet.moons)
        ? planet.moons.length
        : 0;

      const type = planet.bodyType || "Planet";

      return `
        <tr class="hover:bg-slate-800/30 transition-colors">

          <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10">
            <div class="flex items-center space-x-2 md:space-x-3">

              <div
                class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0"
                style="background-color:${
                  planetColors[id] || "#64748b"
                }"
              ></div>

              <span class="font-semibold text-sm md:text-base whitespace-nowrap">
                ${escapeHTML(name)}
              </span>

            </div>
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${
              Number.isFinite(au)
                ? formatNumber(au, 2)
                : "N/A"
            }
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${formatNumber(planet.meanRadius * 2, 0)}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${
              planet.mass
                ? `${planet.mass.massValue} × 10^${planet.mass.massExponent}`
                : "N/A"
            }
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${escapeHTML(orbitalPeriod)}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${moons}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
            <span class="px-2 py-1 rounded text-xs bg-blue-500/50 text-blue-200">
              ${escapeHTML(type)}
            </span>
          </td>

        </tr>
      `;
    }).join("");
  }

  // ---------- Load planets from the API ----------
  async function loadPlanets() {
    if (!planetsGrid) return;

    try {
      const data = await fetchJSON(PLANETS_API_URL);

      const planets = (data.bodies || [])
        .filter((body) => body.isPlanet)
        .sort((a, b) => {
          const order = [
            "mercury",
            "venus",
            "earth",
            "mars",
            "jupiter",
            "saturn",
            "uranus",
            "neptune",
          ];

          return order.indexOf(a.id) - order.indexOf(b.id);
        });

      if (!planets.length) {
        throw new Error("The API returned no planets.");
      }

      updatePlanetCards(planets);
      updateComparisonTable(planets);

      const planetsById = Object.fromEntries(
        planets.map((planet) => [
          String(planet.id).toLowerCase(),
          planet,
        ])
      );

      // Select a planet when its card is clicked
      $$(".planet-card").forEach((card) => {
        card.addEventListener("click", () => {
          const selectedPlanet =
            planetsById[card.dataset.planetId];

          if (selectedPlanet) {
            showPlanetDetails(selectedPlanet);
          }
        });
      });

      // Show Earth details when the page first loads
      const initialPlanet =
        planetsById.earth || planets[0];

      if (initialPlanet) {
        showPlanetDetails(initialPlanet);
      }

      const facts = $("#planet-facts");

      if (facts && initialPlanet) {
        facts.textContent =
          planetDescriptionText(initialPlanet);
      }

    } catch (error) {
      console.error("Planets API error:", error);

      // Keep existing HTML cards usable if the API fails
      $$(".planet-card").forEach((card) => {
        card.addEventListener("click", () => {
          const name =
            $("h4", card)?.textContent || "Planet";

          if (planetName) {
            planetName.textContent = name;
          }

          if (planetDescription) {
            planetDescription.textContent =
              `Live information for ${name} could not be loaded. Please check your connection and refresh the page.`;
          }
        });
      });
    }
  }

  // ---------- Start the dashboard ----------
  showSection("today-in-space");

  loadAPOD();
  loadLaunches();
  loadPlanets();

});