"use client";

import clsx from "clsx";
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
  const filteredSubjects = getFilteredSubjects(activeGrade);

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
            {tab.label}
          </button>
        ))}
      </div>

      {activeLevel === "academic" && (
        <div className="flex items-center gap-2 flex-wrap">
          <SubjectDropdown
            label="Chọn lớp"
            options={ACADEMIC_GRADES}
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
            label="Chọn môn"
            options={filteredSubjects}
            value={activeSubject}
            onChange={onSubjectChange}
          />
        </div>
      )}

      {activeLevel === "university" && (
        <div className="flex items-center gap-2">
          <SubjectDropdown
            label="Chọn khối ngành"
            options={UNIVERSITY_MAJORS}
            value={activeMajor}
            onChange={onMajorChange}
          />
        </div>
      )}
    </div>
  );
}
