(() => {
  'use strict';

  const form = document.getElementById('resume-form');
  const experienceList = document.getElementById('experience-list');
  const educationList = document.getElementById('education-list');
  const skillsList = document.getElementById('skills-list');
  const formMessage = document.getElementById('form-message');
  const preview = document.getElementById('resume-preview');
  const skillEntry = document.getElementById('skill-entry');
  const photoInput = document.getElementById('profile-photo');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const previewPhoto = document.getElementById('preview-photo');
  const removePhotoButton = document.getElementById('remove-photo');
  const skills = [];
  let photoData = '';

  const fieldValue = (id) => document.getElementById(id).value.trim();
  const safeText = (value) => String(value || '').trim();

  function createRepeatCard(kind) {
    const template = document.getElementById(`${kind}-template`);
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('.remove-button').addEventListener('click', () => {
      card.remove();
      updatePreview();
    });
    card.querySelectorAll('input, textarea').forEach((input) => input.addEventListener('input', updatePreview));
    (kind === 'experience' ? experienceList : educationList).appendChild(card);
    updatePreview();
    const firstInput = card.querySelector('input');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  function createSimpleEntry(kind) {
    const container = document.getElementById(`${kind}s-list`);
    const input = document.createElement('input');
    input.className = 'simple-entry';
    input.type = 'text';
    input.maxLength = 70;
    input.placeholder = kind === 'language' ? 'e.g. English — Fluent' : 'e.g. Photography';
    input.setAttribute('aria-label', kind === 'language' ? 'Language' : 'Hobby or interest');
    input.addEventListener('input', updatePreview);
    const row = document.createElement('div');
    row.className = 'simple-entry-row';
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    row.append(input);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', kind === 'language' ? 'Remove language' : 'Remove interest');
    remove.style.cssText = 'font-size:16px;flex-shrink:0';
    remove.addEventListener('click', () => { row.remove(); updatePreview(); });
    row.append(remove);
    container.append(row);
    input.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.add === 'experience' || button.dataset.add === 'education') createRepeatCard(button.dataset.add);
      else createSimpleEntry(button.dataset.add);
    });
  });

  function addSkill(value) {
    const skill = safeText(value).replace(/,/g, '').slice(0, 40);
    if (!skill || skills.some((item) => item.toLowerCase() === skill.toLowerCase())) return;
    skills.push(skill);
    renderSkillChips();
    updatePreview();
  }

  function renderSkillChips() {
    skillsList.replaceChildren();
    skills.forEach((skill, index) => {
      const chip = document.createElement('span');
      chip.className = 'skill-chip';
      chip.append(document.createTextNode(skill));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${skill}`);
      remove.addEventListener('click', () => { skills.splice(index, 1); renderSkillChips(); updatePreview(); });
      chip.append(remove);
      skillsList.append(chip);
    });
  }

  skillEntry.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(skillEntry.value);
      skillEntry.value = '';
    }
  });
  skillEntry.addEventListener('blur', () => {
    if (skillEntry.value.trim()) { addSkill(skillEntry.value); skillEntry.value = ''; }
  });

  function getRows(container, fields) {
    return Array.from(container.querySelectorAll('.repeat-card')).map((card) => {
      const row = {};
      fields.forEach((field) => { row[field] = safeText(card.querySelector(`[data-field="${field}"]`)?.value); });
      return row;
    }).filter((row) => Object.values(row).some(Boolean));
  }

  function getSimpleValues(id) {
    return Array.from(document.querySelectorAll(`#${id} .simple-entry`)).map((input) => safeText(input.value)).filter(Boolean);
  }

  function makeEntry(title, subtitle, dates, details) {
    const article = document.createElement('article');
    article.className = 'preview-entry';
    const heading = document.createElement('div');
    heading.className = 'preview-entry-heading';
    const strong = document.createElement('strong');
    strong.textContent = title;
    heading.append(strong);
    if (dates) {
      const date = document.createElement('span');
      date.className = 'preview-entry-date';
      date.textContent = dates;
      heading.append(date);
    }
    article.append(heading);
    if (subtitle) {
      const sub = document.createElement('p');
      sub.className = 'preview-entry-sub';
      sub.textContent = subtitle;
      article.append(sub);
    }
    if (details) {
      const description = document.createElement('p');
      description.className = 'preview-entry-details';
      description.textContent = details;
      article.append(description);
    }
    return article;
  }

  function setBlockVisibility(id, visible) {
    document.getElementById(id).classList.toggle('hidden', !visible);
  }

  function updatePreview() {
    const name = fieldValue('full-name');
    document.getElementById('preview-name').textContent = name || 'Your Name';
    document.getElementById('preview-title').textContent = fieldValue('job-title') || 'Your professional title';
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'JD';
    if (!photoData) photoPlaceholder.textContent = initials;

    const contact = document.getElementById('preview-contact');
    contact.replaceChildren();
    [fieldValue('email'), fieldValue('phone'), fieldValue('location'), fieldValue('website')].filter(Boolean).forEach((value) => {
      const item = document.createElement('span');
      item.textContent = value;
      contact.append(item);
    });

    const objective = fieldValue('objective');
    const objectiveElement = document.getElementById('preview-objective');
    objectiveElement.textContent = objective || 'Your career objective will appear here.';
    objectiveElement.classList.toggle('preview-placeholder', !objective);
    const objectiveTitle = document.querySelector('#preview-objective-block h2');
    objectiveTitle.textContent = objective ? 'Profile' : 'Career objective';
    setBlockVisibility('preview-objective-block', Boolean(objective));

    const experiences = getRows(experienceList, ['role', 'company', 'location', 'start', 'end', 'details']);
    const experienceTarget = document.getElementById('preview-experience');
    experienceTarget.replaceChildren();
    experiences.forEach((item) => experienceTarget.append(makeEntry(item.role || 'Position', [item.company, item.location].filter(Boolean).join(' · '), [item.start, item.end].filter(Boolean).join(' — '), item.details)));
    setBlockVisibility('preview-experience-block', experiences.length > 0);

    const education = getRows(educationList, ['degree', 'school', 'start', 'end', 'details']);
    const educationTarget = document.getElementById('preview-education');
    educationTarget.replaceChildren();
    education.forEach((item) => educationTarget.append(makeEntry(item.degree || 'Qualification', item.school, [item.start, item.end].filter(Boolean).join(' — '), item.details)));
    setBlockVisibility('preview-education-block', education.length > 0);

    const skillsTarget = document.getElementById('preview-skills');
    skillsTarget.replaceChildren();
    skills.forEach((skill) => { const tag = document.createElement('span'); tag.className = 'preview-tag'; tag.textContent = skill; skillsTarget.append(tag); });
    setBlockVisibility('preview-skills-block', skills.length > 0);

    [['languages', getSimpleValues('languages-list'), 'preview-languages'], ['hobbies', getSimpleValues('hobbies-list'), 'preview-hobbies']].forEach(([kind, values, targetId]) => {
      const target = document.getElementById(targetId);
      target.replaceChildren();
      values.forEach((value) => { const item = document.createElement('span'); item.textContent = value; target.append(item); });
      setBlockVisibility(`preview-${kind}-block`, values.length > 0);
    });

    const hasContent = Boolean(objective || experiences.length || education.length || skills.length || getSimpleValues('languages-list').length || getSimpleValues('hobbies-list').length);
    document.getElementById('empty-preview-note').classList.toggle('hidden', hasContent);
    document.getElementById('objective-count').textContent = String(objective.length);
  }

  form.addEventListener('input', (event) => {
    if (event.target.id !== 'skill-entry') updatePreview();
    if (event.target.matches('input, textarea')) formMessage.textContent = '';
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      formMessage.textContent = 'Please choose a JPG, PNG, or WebP image.';
      photoInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      formMessage.textContent = 'Your photo must be smaller than 5 MB.';
      photoInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      photoData = String(reader.result || '');
      photoPlaceholder.style.backgroundImage = `url("${photoData}")`;
      photoPlaceholder.textContent = '';
      previewPhoto.src = photoData;
      previewPhoto.classList.remove('hidden');
      removePhotoButton.classList.remove('hidden');
    });
    reader.readAsDataURL(file);
  });

  removePhotoButton.addEventListener('click', () => {
    photoData = '';
    photoInput.value = '';
    photoPlaceholder.style.backgroundImage = '';
    removePhotoButton.classList.add('hidden');
    previewPhoto.removeAttribute('src');
    previewPhoto.classList.add('hidden');
    updatePreview();
  });

  document.querySelectorAll('.template-option').forEach((button) => {
    button.addEventListener('click', () => {
      const style = button.dataset.template;
      preview.classList.remove('template-modern', 'template-classic', 'template-minimal');
      preview.classList.add(`template-${style}`);
      document.querySelectorAll('.template-option').forEach((option) => {
        const active = option === button;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
      });
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    formMessage.classList.remove('success');
    if (!nameInput.value.trim()) {
      formMessage.textContent = 'Please enter your full name.';
      nameInput.focus();
      return;
    }
    if (!emailInput.value.trim() || !emailInput.validity.valid) {
      formMessage.textContent = 'Please enter a valid email address.';
      emailInput.focus();
      return;
    }
    const websiteInput = document.getElementById('website');
    if (websiteInput.value.trim() && !websiteInput.validity.valid) {
      formMessage.textContent = 'Please enter a valid website URL, including https://.';
      websiteInput.focus();
      return;
    }
    updatePreview();
    formMessage.textContent = 'Your resume is ready — review it in the live preview.';
    formMessage.classList.add('success');
    document.querySelector('.preview-column').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('edit-button').addEventListener('click', () => {
    document.getElementById('full-name').focus({ preventScroll: true });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('download-button').addEventListener('click', () => window.print());
  document.getElementById('print-button').addEventListener('click', () => window.print());

  document.querySelectorAll('#resume-form input, #resume-form textarea').forEach((input) => input.addEventListener('input', updatePreview));
  createRepeatCard('experience');
  createRepeatCard('education');
  updatePreview();
})();
