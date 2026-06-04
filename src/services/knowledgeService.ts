import { student } from '../data/student';
import { modules } from '../data/modules';
import { scheduleEntries } from '../data/schedule';
import { rules } from '../data/rules';
import { sources } from '../data/sources';
import { recommendedModules, notRecommendedModules } from '../data/recommendation';
import type { Module, ScheduleEntry } from '../types';

export function getStudent() {
  return student;
}

export function getAllModules(): Module[] {
  return modules;
}

export function getOpenModules(): Module[] {
  const openCodes = student.openModules.map((m) => m.code);
  return modules.filter((m) => openCodes.includes(m.moduleCode));
}

export function getPassedModules() {
  return student.passedModules;
}

export function getScheduleEntries(): ScheduleEntry[] {
  return scheduleEntries;
}

export function getAvailableEntries(): ScheduleEntry[] {
  return scheduleEntries.filter((e) => e.availableForDummy === true);
}

export function getBlockedEntries(): ScheduleEntry[] {
  return scheduleEntries.filter((e) => e.availableForDummy === false);
}

export function getRules() {
  return rules;
}

export function getSources() {
  return sources;
}

export function getRecommendedModules() {
  return recommendedModules;
}

export function getNotRecommendedModules() {
  return notRecommendedModules;
}

export function getTotalRecommendedEcts(): number {
  return recommendedModules.reduce((sum, r) => sum + r.ects, 0);
}
