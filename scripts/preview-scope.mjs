import path from 'node:path';

function isWithin(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function isLessonPackageDirectory(lessonDirectory, classesDirectory) {
  if (!isWithin(classesDirectory, lessonDirectory)) return false;
  const segments = path.relative(classesDirectory, lessonDirectory).split(path.sep);
  return segments.length === 2 && segments.every(Boolean);
}

export function isAllowedPreviewFile(file, { lessonDirectory, revealDirectory, componentsDirectory, themePath, presentationDirectory, fontsDirectory }) {
  return file === themePath || [lessonDirectory, revealDirectory, componentsDirectory, presentationDirectory, fontsDirectory].filter(Boolean).some((directory) => isWithin(directory, file));
}
