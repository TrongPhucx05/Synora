"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import {
  LEVEL_TABS,
  ACADEMIC_GRADES,
  ACADEMIC_SUBJECTS,
  UNIVERSITY_MAJORS,
} from "@/lib/library/data";
import type { LevelKey } from "@/lib/library/types";
import SubjectDropdown from "./SubjectDropdown";

interface LevelFilterBarProps {
  activeLevel: LevelKey;
  onLevelChange: (v: LevelKey) => void;
  activeGrade: string;
  onGradeChange: (v: string) => void;
  activeSubject: string;
  onSubjectChange: (v: string) => void;
  activeMajor: string;
  onMajorChange: (v: string) => void;
}

const THPT_ONLY_SUBJECTS = ["economics"];
const THCS_ONLY_SUBJECTS = ["civics"];

function getFilteredSubjects(grade: string) {
  const isThcs = ["6", "7", "8", "9"].includes(grade);
  const isThpt = ["10", "11", "12"].includes(grade);

  return ACADEMIC_SUBJECTS.filter((s) => {
    if (THPT_ONLY_SUBJECTS.includes(s.id)) return isThpt || !grade;
    if (THCS_ONLY_SUBJECTS.includes(s.id)) return isThcs || !grade;
    return true;
  });
}

export default function LevelFilterBar({
  activeLevel,
  onLevelChange,
  activeGrade,
  onGradeChange,
  activeSubject,
  onSubjectChange,
  activeMajor,
  onMajorChange,
}: LevelFilterBarProps) {
  const t = useTranslations("library.data");
  const td = useTranslations("library.dropdown");
  const filteredSubjects = getFilteredSubjects(activeGrade);

  const gradeOptions = ACADEMIC_GRADES.map((g) => ({
    id: g.id,
    label: t(g.labelKey),
  }));
  const subjectOptions = filteredSubjects.map((s) => ({
    id: s.id,
    label: t(s.labelKey),
  }));
  const majorOptions = UNIVERSITY_MAJORS.map((m) => ({
    id: m.id,
    label: t(m.labelKey),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {LEVEL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onLevelChange(tab.id as LevelKey)}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeLevel === tab.id
                ? "bg-primary text-white shadow-sm"
                : "bg-surface border border-surface-200 text-text-secondary hover:border-primary hover:text-primary",
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeLevel === "academic" && (
        <div className="flex items-center gap-2 flex-wrap">
          <SubjectDropdown
            label={td("chooseGrade")}
            options={gradeOptions}
            value={activeGrade}
            onChange={(v) => {
              onGradeChange(v);
              const newFiltered = getFilteredSubjects(v);
              if (
                activeSubject &&
                !newFiltered.find((s) => s.id === activeSubject)
              ) {
                onSubjectChange("");
              }
            }}
          />
          <SubjectDropdown
            label={td("chooseSubject")}
            options={subjectOptions}
            value={activeSubject}
            onChange={onSubjectChange}
          />
        </div>
      )}

      {activeLevel === "university" && (
        <div className="flex items-center gap-2">
          <SubjectDropdown
            label={td("chooseMajor")}
            options={majorOptions}
            value={activeMajor}
            onChange={onMajorChange}
          />
        </div>
      )}
    </div>
  );
}