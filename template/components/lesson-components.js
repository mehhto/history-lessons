import { galleryNavigationIndex, isGalleryNavigationKey } from './lesson-components-core.mjs';

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
    items.forEach((item, index) => {
      const isActive = index === activeIndex;
      item.classList.toggle('is-active', isActive);
    });
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

if (!customElements.get('lesson-gallery')) customElements.define('lesson-gallery', LessonGallery);
