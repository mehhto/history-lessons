import { clampPercentage, counterValueAtProgress, galleryNavigationIndex, isGalleryNavigationKey } from './lesson-components-core.mjs';

const revealKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'PageUp', 'PageDown']);

function keepKeysInsideComponent(element) {
  element.addEventListener('keydown', (event) => {
    if (revealKeys.has(event.key)) event.stopPropagation();
  });
}

class LessonGallery extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    this.setAttribute('role', 'group');
    const items = [...this.querySelectorAll('[data-gallery-item]')];
    items.forEach((item, index) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.addEventListener('pointerenter', () => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) this.activate(index);
      });
      item.addEventListener('focus', () => this.activate(index));
      item.addEventListener('click', () => this.activate(index));
      item.addEventListener('keydown', (event) => this.handleKeydown(event, index));
    });
    this.addEventListener('pointerleave', () => {
      if (!this.contains(document.activeElement)) this.activate(null);
    });
  }

  activate(activeIndex) {
    const items = [...this.querySelectorAll('[data-gallery-item]')];
    items.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
    this.classList.toggle('has-active-item', activeIndex !== null);
  }

  handleKeydown(event, activeIndex) {
    if (!isGalleryNavigationKey(event.key)) return;
    event.stopPropagation();
    const nextIndex = galleryNavigationIndex(activeIndex, event.key, this.querySelectorAll('[data-gallery-item]').length);
    if (nextIndex === activeIndex && !['Enter', ' '].includes(event.key)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activate(activeIndex);
      return;
    }
    if (nextIndex === null || nextIndex !== activeIndex) {
      event.preventDefault();
      this.activate(nextIndex);
      if (nextIndex !== null) this.querySelectorAll('[data-gallery-item]')[nextIndex].focus();
    }
  }
}

class LessonDisclosure extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    this.querySelectorAll('summary').forEach((summary) => keepKeysInsideComponent(summary));
  }
}

class LessonCounter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const target = Number(this.getAttribute('value'));
    const suffix = this.getAttribute('suffix') || '';
    const formatter = new Intl.NumberFormat(this.getAttribute('locale') || 'pl-PL');
    const render = (progress) => { this.textContent = `${formatter.format(counterValueAtProgress(target, progress))}${suffix}`; };
    const animate = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return render(1);
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / 850);
        render(progress);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    render(0);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate();
      }, { threshold: .45 });
      observer.observe(this);
    } else animate();
  }
}

class LessonMap extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    this.querySelectorAll('[data-map-pin]').forEach((pin) => {
      pin.addEventListener('click', () => this.select(pin));
      keepKeysInsideComponent(pin);
    });
    const mapButton = this.querySelector('[data-map-open]');
    const mapFrame = this.querySelector('iframe[data-map-src]');
    if (mapButton && mapFrame) {
      keepKeysInsideComponent(mapButton);
      mapButton.addEventListener('click', () => {
        mapFrame.src = mapFrame.dataset.mapSrc;
        mapFrame.hidden = false;
        mapButton.hidden = true;
      });
    }
  }

  select(pin) {
    const panelId = pin.getAttribute('aria-controls');
    this.querySelectorAll('[data-map-pin]').forEach((item) => item.setAttribute('aria-pressed', String(item === pin)));
    this.querySelectorAll('[data-map-panel]').forEach((panel) => {
      const selected = panel.id === panelId;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    });
  }
}

class LessonCompare extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const input = this.querySelector('input[type="range"]');
    const output = this.querySelector('output');
    if (!input) return;
    const update = () => {
      const value = clampPercentage(input.value);
      this.style.setProperty('--compare-position', `${value}%`);
      if (output) output.value = `${Math.round(value)}%`;
    };
    input.addEventListener('input', update);
    keepKeysInsideComponent(input);
    update();
  }
}

class LessonVideo extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const button = this.querySelector('[data-video-play]');
    const frame = this.querySelector('iframe[data-video-src]');
    if (!button || !frame) return;
    keepKeysInsideComponent(button);
    button.addEventListener('click', () => {
      frame.src = frame.dataset.videoSrc;
      frame.hidden = false;
      button.hidden = true;
    });
  }
}

for (const [name, component] of [
  ['lesson-gallery', LessonGallery],
  ['lesson-disclosure', LessonDisclosure],
  ['lesson-counter', LessonCounter],
  ['lesson-map', LessonMap],
  ['lesson-compare', LessonCompare],
  ['lesson-video', LessonVideo],
]) {
  if (!customElements.get(name)) customElements.define(name, component);
}
