import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Users2,
  Clock,
  FlaskConical,
  Award,
  Filter,
  CheckCircle,
  X,
  Search,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Building,
  Archive,
  Edit3,
  Trash2,
  Sparkles,
  BarChart3,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  FolderTree,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  Subject,
  Department,
  FacultyProfile,
  User,
  WorkloadAllocation,
  UserRole,
  Course,
  Semester,
  Section,
  SectionSubject,
  FacultySubjectAssignment,
  DegreeLevel,
  SubjectType,
  WorkloadComponent
} from '../types/database';
import {
  academicSubjectSchema,
  courseSchema,
  semesterSchema,
  sectionSchema,
  assignFacultyToSectionSubjectSchema
} from '../lib/validations';

interface SubjectAllocationProps {
  subjects: Subject[];
  departments: Department[];
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  sectionSubjects: SectionSubject[];
  facultySubjectAssignments: FacultySubjectAssignment[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  workloads: WorkloadAllocation[];
  onAddSubject: (subject: {
    code: string;
    name: string;
    departmentId: string;
    courseId?: string;
    semesterId?: string;
    subjectType?: SubjectType;
    credits?: number;
    theoryHours?: number;
    practicalHours?: number;
    lectureHours: number;
    labHours: number;
    theoryCredits: number;
    labCredits: number;
  }) => void;
  onUpdateSubject?: (id: string, updated: Partial<Subject>) => void;
  onDeleteSubject?: (id: string) => void;
  onAddCourse?: (course: Omit<Course, 'id' | 'created_at'>) => void;
  onUpdateCourse?: (id: string, updated: Partial<Course>) => void;
  onDeleteCourse?: (id: string) => void;
  onAddSemester?: (semester: Omit<Semester, 'id' | 'created_at'>) => void;
  onUpdateSemester?: (id: string, updated: Partial<Semester>) => void;
  onArchiveSemester?: (id: string) => void;
  onAddSection?: (section: Omit<Section, 'id' | 'created_at'>) => void;
  onUpdateSection?: (id: string, updated: Partial<Section>) => void;
  onDeleteSection?: (id: string) => void;
  onAssignFacultyToSection?: (assignment: Omit<FacultySubjectAssignment, 'id' | 'created_at'>) => void;
  onRemoveFacultySubjectAssignment?: (id: string) => void;
  currentRole: UserRole;
  userAssignedDeptId?: string;
}

type AcademicSubTab = 'subjects' | 'assignments' | 'courses' | 'semesters' | 'sections';

export const SubjectAllocation: React.FC<SubjectAllocationProps> = ({
  subjects,
  departments,
  courses,
  semesters,
  sections,
  sectionSubjects,
  facultySubjectAssignments,
  facultyProfiles,
  users,
  workloads,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddSemester,
  onUpdateSemester,
  onArchiveSemester,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAssignFacultyToSection,
  onRemoveFacultySubjectAssignment,
  currentRole,
  userAssignedDeptId,
}) => {
  // Navigation & Filter States
  const [activeSubTab, setActiveSubTab] = useState<AcademicSubTab>('subjects');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>(
    currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : 'ALL'
  );
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Item for Detail Slide-Over
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Modals
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [isAssignFacultyModalOpen, setIsAssignFacultyModalOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);
  const [isEditSemesterModalOpen, setIsEditSemesterModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);

  // Analytics toggle
  const [showDepartmentAnalytics, setShowDepartmentAnalytics] = useState(true);

  // Targets for editing
  const [targetSubjectToEdit, setTargetSubjectToEdit] = useState<Subject | null>(null);
  const [targetCourseToEdit, setTargetCourseToEdit] = useState<Course | null>(null);
  const [targetSemesterToEdit, setTargetSemesterToEdit] = useState<Semester | null>(null);
  const [targetSectionToEdit, setTargetSectionToEdit] = useState<Section | null>(null);

  // Form Error / Success feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Subject Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectDeptId, setSubjectDeptId] = useState(departments[0]?.id || '');
  const [subjectCourseId, setSubjectCourseId] = useState(courses[0]?.id || '');
  const [subjectSemesterId, setSubjectSemesterId] = useState(semesters[0]?.id || '');
  const [subjectType, setSubjectType] = useState<SubjectType>('CORE');
  const [subjectCredits, setSubjectCredits] = useState(4);
  const [subjectTheoryHours, setSubjectTheoryHours] = useState(3);
  const [subjectPracticalHours, setSubjectPracticalHours] = useState(2);

  // Faculty Assignment Modal State
  const [assignTargetSubjectId, setAssignTargetSubjectId] = useState<string>('');
  const [assignFacultyId, setAssignFacultyId] = useState<string>(facultyProfiles[0]?.id || '');
  const [assignSectionId, setAssignSectionId] = useState<string>(sections[0]?.id || '');
  const [assignComponent, setAssignComponent] = useState<WorkloadComponent>('LECTURE');
  const [assignHours, setAssignHours] = useState<number>(3);
  const [assignIsLead, setAssignIsLead] = useState<boolean>(true);

  // Course Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDeptId, setCourseDeptId] = useState(departments[0]?.id || '');
  const [courseDegreeLevel, setCourseDegreeLevel] = useState<DegreeLevel>('UNDERGRADUATE');
  const [courseDuration, setCourseDuration] = useState(4);
  const [courseTotalSemesters, setCourseTotalSemesters] = useState(8);

  // Semester Form State
  const [semName, setSemName] = useState('');
  const [semCourseId, setSemCourseId] = useState(courses[0]?.id || '');
  const [semDeptId, setSemDeptId] = useState(departments[0]?.id || '');
  const [semTermNumber, setSemTermNumber] = useState(5);
  const [semAcademicYear, setSemAcademicYear] = useState('2025-2026');
  const [semStartDate, setSemStartDate] = useState('2025-08-01');
  const [semEndDate, setSemEndDate] = useState('2025-12-15');

  // Section Form State
  const [secName, setSecName] = useState('Section A');
  const [secDeptId, setSecDeptId] = useState(departments[0]?.id || '');
  const [secCourseId, setSecCourseId] = useState(courses[0]?.id || '');
  const [secSemesterId, setSecSemesterId] = useState(semesters[0]?.id || '');
  const [secStudentStrength, setSecStudentStrength] = useState(60);

  // Filtered Subjects
  const filteredSubjects = subjects.filter((s) => {
    if (currentRole === 'ADMIN' && userAssignedDeptId && s.department_id !== userAssignedDeptId) {
      return false;
    }
    const matchesDept = selectedDeptFilter === 'ALL' || s.department_id === selectedDeptFilter;
    const matchesCourse = selectedCourseFilter === 'ALL' || s.course_id === selectedCourseFilter;
    const matchesType = selectedTypeFilter === 'ALL' || (s.subject_type || 'CORE') === selectedTypeFilter;
    const matchesSearch =
      !searchQuery ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesCourse && matchesType && matchesSearch;
  });

  // Filtered Faculty Assignments
  const filteredAssignments = facultySubjectAssignments.filter((fsa) => {
    if (currentRole === 'FACULTY') {
      // Find logged in faculty member (e.g. Rahul Sharma)
      return fsa.faculty_id === 'fac-rahul';
    }
    if (currentRole === 'ADMIN' && userAssignedDeptId) {
      return fsa.department_id === userAssignedDeptId;
    }
    if (selectedDeptFilter !== 'ALL') {
      return fsa.department_id === selectedDeptFilter;
    }
    return true;
  });

  // Analytics KPIs
  const totalSubjectsCount = subjects.length;
  const coreSubjectsCount = subjects.filter((s) => (s.subject_type || 'CORE') === 'CORE').length;
  const electiveCount = subjects.filter((s) => s.subject_type === 'ELECTIVE' || s.subject_type === 'OPEN_ELECTIVE').length;
  const assignedSubjectIds = new Set(facultySubjectAssignments.map((a) => a.subject_id));
  const unassignedSubjectsCount = subjects.filter((s) => !assignedSubjectIds.has(s.id)).length;
  const totalAssignedHours = facultySubjectAssignments.reduce((acc, curr) => acc + curr.hours_per_week, 0);

  // Active Subject Detail
  const activeSubject = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) || null : null;
  const activeSubjectAssignments = activeSubject
    ? facultySubjectAssignments.filter((a) => a.subject_id === activeSubject.id)
    : [];
  const activeSubjectDepartment = activeSubject
    ? departments.find((d) => d.id === activeSubject.department_id)
    : null;
  const activeSubjectCourse = activeSubject?.course_id
    ? courses.find((c) => c.id === activeSubject.course_id)
    : null;
  const activeSubjectSemester = activeSubject?.semester_id
    ? semesters.find((sem) => sem.id === activeSubject.semester_id)
    : null;

  // Handlers
  const handleOpenAddSubject = () => {
    setFormError(null);
    setFormSuccess(null);
    setSubjectCode('');
    setSubjectName('');
    setSubjectDeptId(currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || '');
    setSubjectCourseId(courses[0]?.id || '');
    setSubjectSemesterId(semesters[0]?.id || '');
    setSubjectType('CORE');
    setSubjectCredits(4);
    setSubjectTheoryHours(3);
    setSubjectPracticalHours(2);
    setIsAddSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: Subject) => {
    setFormError(null);
    setFormSuccess(null);
    setTargetSubjectToEdit(subj);
    setSubjectCode(subj.code);
    setSubjectName(subj.name);
    setSubjectDeptId(subj.department_id);
    setSubjectCourseId(subj.course_id || courses[0]?.id || '');
    setSubjectSemesterId(subj.semester_id || semesters[0]?.id || '');
    setSubjectType(subj.subject_type || 'CORE');
    setSubjectCredits(subj.credits || subj.theory_credits + subj.lab_credits || 4);
    setSubjectTheoryHours(subj.theory_hours ?? subj.lecture_hours_per_week ?? 3);
    setSubjectPracticalHours(subj.practical_hours ?? subj.lab_hours_per_week ?? 2);
    setIsEditSubjectModalOpen(true);
  };

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const validation = academicSubjectSchema.safeParse({
      code: subjectCode.toUpperCase().trim(),
      name: subjectName.trim(),
      department_id: subjectDeptId,
      course_id: subjectCourseId,
      semester_id: subjectSemesterId,
      subject_type: subjectType,
      credits: Number(subjectCredits),
      theory_hours: Number(subjectTheoryHours),
      practical_hours: Number(subjectPracticalHours),
      is_active: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    // Check duplicate code
    const isDuplicate = subjects.some(
      (s) => s.code.toUpperCase() === subjectCode.toUpperCase().trim() && s.department_id === subjectDeptId
    );
    if (isDuplicate) {
      setFormError(`Subject code ${subjectCode.toUpperCase()} already exists in this department.`);
      return;
    }

    onAddSubject({
      code: subjectCode.toUpperCase().trim(),
      name: subjectName.trim(),
      departmentId: subjectDeptId,
      courseId: subjectCourseId || undefined,
      semesterId: subjectSemesterId || undefined,
      subjectType,
      credits: Number(subjectCredits),
      theoryHours: Number(subjectTheoryHours),
      practicalHours: Number(subjectPracticalHours),
      lectureHours: Number(subjectTheoryHours),
      labHours: Number(subjectPracticalHours),
      theoryCredits: Math.max(1, Math.round(Number(subjectCredits) * 0.75)),
      labCredits: Math.round(Number(subjectCredits) * 0.25),
    });

    setIsAddSubjectModalOpen(false);
  };

  const handleUpdateSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubjectToEdit || !onUpdateSubject) return;

    onUpdateSubject(targetSubjectToEdit.id, {
      name: subjectName.trim(),
      subject_type: subjectType,
      credits: Number(subjectCredits),
      theory_hours: Number(subjectTheoryHours),
      practical_hours: Number(subjectPracticalHours),
      lecture_hours_per_week: Number(subjectTheoryHours),
      lab_hours_per_week: Number(subjectPracticalHours),
      course_id: subjectCourseId || undefined,
      semester_id: subjectSemesterId || undefined,
    });

    setIsEditSubjectModalOpen(false);
  };

  const handleOpenAssignModal = (subjectId: string) => {
    setFormError(null);
    setAssignTargetSubjectId(subjectId);
    setAssignFacultyId(facultyProfiles[0]?.id || '');
    setAssignSectionId(sections[0]?.id || '');
    setAssignComponent('LECTURE');
    setAssignHours(3);
    setAssignIsLead(true);
    setIsAssignFacultyModalOpen(true);
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetSubj = subjects.find((s) => s.id === assignTargetSubjectId);
    const targetSec = sections.find((s) => s.id === assignSectionId);
    if (!targetSubj || !targetSec) {
      setFormError('Please select both a valid subject and section.');
      return;
    }

    // Check duplicate assignment
    const isDuplicate = facultySubjectAssignments.some(
      (a) =>
        a.faculty_id === assignFacultyId &&
        a.subject_id === assignTargetSubjectId &&
        a.section_id === assignSectionId &&
        a.component === assignComponent
    );

    if (isDuplicate) {
      setFormError('This faculty member is already assigned to this subject, section, and component.');
      return;
    }

    if (onAssignFacultyToSection) {
      onAssignFacultyToSection({
        faculty_id: assignFacultyId,
        subject_id: assignTargetSubjectId,
        section_id: assignSectionId,
        semester_id: targetSec.semester_id,
        department_id: targetSubj.department_id,
        institute_id: targetSubj.institute_id,
        component: assignComponent,
        hours_per_week: Number(assignHours),
        academic_year: '2025-2026',
        is_lead_faculty: assignIsLead,
      });
    }

    setIsAssignFacultyModalOpen(false);
  };

  // Course handlers
  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = courseSchema.safeParse({
      code: courseCode.toUpperCase().trim(),
      name: courseName.trim(),
      department_id: courseDeptId,
      degree_level: courseDegreeLevel,
      duration_years: Number(courseDuration),
      total_semesters: Number(courseTotalSemesters),
      is_active: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (courses.some((c) => c.code.toUpperCase() === courseCode.toUpperCase().trim())) {
      setFormError(`Course code ${courseCode.toUpperCase()} already exists.`);
      return;
    }

    if (onAddCourse) {
      onAddCourse({
        code: courseCode.toUpperCase().trim(),
        name: courseName.trim(),
        department_id: courseDeptId,
        institute_id: 'inst-001',
        degree_level: courseDegreeLevel,
        duration_years: Number(courseDuration),
        total_semesters: Number(courseTotalSemesters),
        is_active: true,
      });
    }

    setIsAddCourseModalOpen(false);
    setCourseCode('');
    setCourseName('');
  };

  const handleOpenEditCourse = (course: Course) => {
    setFormError(null);
    setFormSuccess(null);
    setTargetCourseToEdit(course);
    setCourseCode(course.code);
    setCourseName(course.name);
    setCourseDeptId(course.department_id);
    setCourseDegreeLevel(course.degree_level);
    setCourseDuration(course.duration_years);
    setCourseTotalSemesters(course.total_semesters);
    setIsEditCourseModalOpen(true);
  };

  const handleUpdateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseToEdit || !onUpdateCourse) return;

    onUpdateCourse(targetCourseToEdit.id, {
      name: courseName.trim(),
      degree_level: courseDegreeLevel,
      duration_years: Number(courseDuration),
      total_semesters: Number(courseTotalSemesters),
      department_id: courseDeptId,
    });

    setIsEditCourseModalOpen(false);
  };

  // Semester handlers
  const handleCreateSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetCourse = courses.find((c) => c.id === semCourseId);
    if (!targetCourse) {
      setFormError('Please select a course for the semester.');
      return;
    }

    if (onAddSemester) {
      onAddSemester({
        name: semName.trim(),
        course_id: semCourseId,
        department_id: targetCourse.department_id,
        institute_id: 'inst-001',
        term_number: Number(semTermNumber),
        academic_year: semAcademicYear,
        start_date: semStartDate,
        end_date: semEndDate,
        is_current: true,
        is_archived: false,
      });
    }

    setIsAddSemesterModalOpen(false);
    setSemName('');
  };

  const handleOpenEditSemester = (sem: Semester) => {
    setFormError(null);
    setFormSuccess(null);
    setTargetSemesterToEdit(sem);
    setSemName(sem.name);
    setSemCourseId(sem.course_id || courses[0]?.id || '');
    setSemDeptId(sem.department_id || departments[0]?.id || '');
    setSemTermNumber(sem.term_number);
    setSemAcademicYear(sem.academic_year);
    setSemStartDate(sem.start_date);
    setSemEndDate(sem.end_date);
    setIsEditSemesterModalOpen(true);
  };

  const handleUpdateSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSemesterToEdit || !onUpdateSemester) return;

    onUpdateSemester(targetSemesterToEdit.id, {
      name: semName.trim(),
      course_id: semCourseId,
      department_id: semDeptId,
      term_number: Number(semTermNumber),
      academic_year: semAcademicYear,
      start_date: semStartDate,
      end_date: semEndDate,
    });

    setIsEditSemesterModalOpen(false);
  };

  // Section handlers
  const handleCreateSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetSem = semesters.find((s) => s.id === secSemesterId);
    if (!targetSem) {
      setFormError('Please select a semester for this section.');
      return;
    }

    if (onAddSection) {
      onAddSection({
        name: secName.trim(),
        department_id: targetSem.department_id || departments[0]?.id,
        course_id: targetSem.course_id || courses[0]?.id,
        semester_id: secSemesterId,
        institute_id: 'inst-001',
        student_strength: Number(secStudentStrength),
        is_active: true,
      });
    }

    setIsAddSectionModalOpen(false);
    setSecName('Section A');
  };

  const handleOpenEditSection = (sec: Section) => {
    setFormError(null);
    setFormSuccess(null);
    setTargetSectionToEdit(sec);
    setSecName(sec.name);
    setSecDeptId(sec.department_id);
    setSecCourseId(sec.course_id || courses[0]?.id || '');
    setSecSemesterId(sec.semester_id);
    setSecStudentStrength(sec.student_strength);
    setIsEditSectionModalOpen(true);
  };

  const handleUpdateSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSectionToEdit || !onUpdateSection) return;

    onUpdateSection(targetSectionToEdit.id, {
      name: secName.trim(),
      department_id: secDeptId,
      course_id: secCourseId,
      semester_id: secSemesterId,
      student_strength: Number(secStudentStrength),
    });

    setIsEditSectionModalOpen(false);
  };

  // Department Breakdown Analytics
  const departmentBreakdown = departments.map((dept) => {
    const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
    const deptCourses = courses.filter((c) => c.department_id === dept.id);
    const deptSections = sections.filter((s) => s.department_id === dept.id);
    const deptAssignments = facultySubjectAssignments.filter((a) => a.department_id === dept.id);
    const deptAssignedSubjectIds = new Set(deptAssignments.map((a) => a.subject_id));
    const deptUnassignedSubjects = deptSubjects.filter((s) => !deptAssignedSubjectIds.has(s.id));
    const deptTotalHours = deptAssignments.reduce((acc, curr) => acc + curr.hours_per_week, 0);

    return {
      department: dept,
      subjectsCount: deptSubjects.length,
      coursesCount: deptCourses.length,
      sectionsCount: deptSections.length,
      assignmentsCount: deptAssignments.length,
      unassignedCount: deptUnassignedSubjects.length,
      totalWeeklyHours: deptTotalHours,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-400" />
              <span>Academic Structure & Subject Management</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Curriculum Core
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Define Courses, Semesters, Student Cohort Sections, Subjects, and map Faculty with automatic workload impact.
          </p>
        </div>

        {/* Action Buttons based on Role */}
        <div className="flex items-center gap-2">
          {currentRole !== 'FACULTY' && (
            <>
              {activeSubTab === 'subjects' && (
                <button
                  onClick={handleOpenAddSubject}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Subject</span>
                </button>
              )}

              {activeSubTab === 'courses' && (
                <button
                  onClick={() => {
                    setCourseCode('');
                    setCourseName('');
                    setCourseDeptId(currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || '');
                    setFormError(null);
                    setIsAddCourseModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Course</span>
                </button>
              )}

              {activeSubTab === 'semesters' && (
                <button
                  onClick={() => {
                    setSemName('Semester 5 (Fall 2025)');
                    setSemTermNumber(5);
                    setFormError(null);
                    setIsAddSemesterModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Semester</span>
                </button>
              )}

              {activeSubTab === 'sections' && (
                <button
                  onClick={() => {
                    setSecName('Section C');
                    setSecStudentStrength(60);
                    setFormError(null);
                    setIsAddSectionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Section</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Subjects</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{totalSubjectsCount}</span>
            <span className="text-[11px] text-zinc-400">({coreSubjectsCount} Core, {electiveCount} Elective)</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Degree Courses</span>
            <GraduationCap className="h-4 w-4 text-[#06B6D4]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{courses.length}</span>
            <span className="text-[11px] text-zinc-400">{semesters.length} Semesters</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Cohorts</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{sections.length}</span>
            <span className="text-[11px] text-zinc-400">Student Sections</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Teaching Assignments</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{facultySubjectAssignments.length}</span>
            <span className={`text-[11px] font-medium ${unassignedSubjectsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {unassignedSubjectsCount > 0 ? `${unassignedSubjectsCount} Unassigned` : '100% Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Department Breakdown Analytics Section */}
      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Department Academic Breakdown & Resource Allocation
            </h3>
          </div>
          <button
            onClick={() => setShowDepartmentAnalytics(!showDepartmentAnalytics)}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {showDepartmentAnalytics ? 'Collapse' : 'Expand Analytics'}
          </button>
        </div>

        {showDepartmentAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {departmentBreakdown.map((item) => {
              const coveragePct =
                item.subjectsCount > 0
                  ? Math.round(((item.subjectsCount - item.unassignedCount) / item.subjectsCount) * 100)
                  : 0;

              return (
                <div
                  key={item.department.id}
                  className="rounded-lg border border-white/[0.06] bg-zinc-900/70 p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${item.department.color_accent || '#4F46E5'}15`,
                          color: item.department.color_accent || '#818CF8',
                          border: `1px solid ${item.department.color_accent || '#4F46E5'}30`,
                        }}
                      >
                        {item.department.code}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.coursesCount} Programs • {item.sectionsCount} Cohorts
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-semibold text-white truncate" title={item.department.name}>
                      {item.department.name}
                    </h4>

                    <div className="mt-2.5 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-zinc-400">
                        <span>Total Subjects:</span>
                        <span className="font-bold text-white font-mono">{item.subjectsCount}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Faculty Assignments:</span>
                        <span className="font-bold text-indigo-400 font-mono">{item.assignmentsCount}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Weekly Workload:</span>
                        <span className="font-bold text-cyan-400 font-mono">{item.totalWeeklyHours} hrs/wk</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Subject Allocation:</span>
                      <span
                        className={`font-mono font-bold ${
                          item.unassignedCount === 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {coveragePct}% ({item.subjectsCount - item.unassignedCount}/{item.subjectsCount})
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          coveragePct === 100
                            ? 'bg-emerald-500'
                            : coveragePct > 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${coveragePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'subjects'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Subjects Directory ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('assignments')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'assignments'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Users2 className="h-4 w-4" />
          <span>Faculty Assignments ({facultySubjectAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('courses')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'courses'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('semesters')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'semesters'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Semesters ({semesters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sections')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'sections'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Sections ({sections.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: SUBJECTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 rounded-xl border border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search code or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-zinc-800/80 border border-white/[0.08] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
                />
              </div>

              {/* Department Filter */}
              {currentRole !== 'ADMIN' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-400">Dept:</span>
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Type Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">Type:</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="CORE">Core</option>
                  <option value="ELECTIVE">Elective</option>
                  <option value="LAB">Lab Practical</option>
                  <option value="OPEN_ELECTIVE">Open Elective</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Showing {filteredSubjects.length} of {subjects.length} subjects
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => {
              const dept = departments.find((d) => d.id === subject.department_id);
              const course = courses.find((c) => c.id === subject.course_id);
              const semester = semesters.find((sem) => sem.id === subject.semester_id);
              const assignmentsForSubj = facultySubjectAssignments.filter(
                (a) => a.subject_id === subject.id
              );

              return (
                <div
                  key={subject.id}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-white/[0.15] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Code & Department Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {subject.code}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${dept?.color_accent || '#4F46E5'}15`,
                            color: dept?.color_accent || '#818CF8',
                            border: `1px solid ${dept?.color_accent || '#4F46E5'}30`,
                          }}
                        >
                          {dept?.code || 'DEPT'}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                        {subject.subject_type || 'CORE'}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="mt-2.5 text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {subject.name}
                    </h3>

                    {/* Academic Mapping */}
                    <div className="mt-2 text-[11px] text-zinc-400 flex flex-wrap items-center gap-1.5">
                      {course && (
                        <span className="text-zinc-300 bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {course.code}
                        </span>
                      )}
                      {semester && (
                        <span className="text-zinc-400">
                          • {semester.name}
                        </span>
                      )}
                    </div>

                    {/* Hours & Credits Pill Bar */}
                    <div className="mt-3 grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-zinc-800/40 text-[11px] font-mono border border-white/[0.04]">
                      <div className="text-center">
                        <span className="text-zinc-400 block text-[10px]">Credits</span>
                        <span className="font-bold text-white">{subject.credits || (subject.theory_credits + subject.lab_credits)}</span>
                      </div>
                      <div className="text-center border-x border-white/[0.06]">
                        <span className="text-zinc-400 block text-[10px]">Theory</span>
                        <span className="font-bold text-indigo-400">{subject.theory_hours ?? subject.lecture_hours_per_week ?? 3}h/wk</span>
                      </div>
                      <div className="text-center">
                        <span className="text-zinc-400 block text-[10px]">Practical</span>
                        <span className="font-bold text-cyan-400">{subject.practical_hours ?? subject.lab_hours_per_week ?? 0}h/wk</span>
                      </div>
                    </div>

                    {/* Faculty Assignments preview */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                        Assigned Faculty ({assignmentsForSubj.length})
                      </span>
                      {assignmentsForSubj.length > 0 ? (
                        <div className="space-y-1">
                          {assignmentsForSubj.map((a) => {
                            const fac = facultyProfiles.find((f) => f.id === a.faculty_id);
                            const user = users.find((u) => u.id === fac?.user_id);
                            const sec = sections.find((s) => s.id === a.section_id);
                            return (
                              <div
                                key={a.id}
                                className="flex items-center justify-between text-[11px] text-zinc-300 bg-zinc-800/30 px-2 py-1 rounded"
                              >
                                <span className="font-medium truncate max-w-[130px]">{user?.full_name || 'Faculty'}</span>
                                <span className="text-zinc-400 font-mono text-[10px]">
                                  {sec?.name || 'Section'} • {a.hours_per_week}h
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-400/90 italic flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          No faculty assigned yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedSubjectId(subject.id)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {currentRole !== 'FACULTY' && (
                        <>
                          <button
                            onClick={() => handleOpenAssignModal(subject.id)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <Users2 className="h-3 w-3" />
                            <span>Assign</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditSubject(subject)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Edit Subject"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {onDeleteSubject && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete subject ${subject.code}?`)) {
                                  onDeleteSubject(subject.id);
                                }
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: FACULTY SUBJECT ASSIGNMENTS & WORKLOAD IMPACT */}
      {/* ========================================================================= */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users2 className="h-4 w-4 text-indigo-400" />
                <span>Section-Level Faculty Teaching Allocations</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Maps individual faculty members to course subjects and student sections with automatic workload accumulation.
              </p>
            </div>

            {currentRole !== 'FACULTY' && (
              <button
                onClick={() => handleOpenAssignModal(subjects[0]?.id || '')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow hover:opacity-95 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Faculty Assignment</span>
              </button>
            )}
          </div>

          {/* Assignments Table */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Cohort Section</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4 text-right">Weekly Hours</th>
                    {currentRole !== 'FACULTY' && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {filteredAssignments.map((assignment) => {
                    const faculty = facultyProfiles.find((f) => f.id === assignment.faculty_id);
                    const user = users.find((u) => u.id === faculty?.user_id);
                    const subj = subjects.find((s) => s.id === assignment.subject_id);
                    const dept = departments.find((d) => d.id === assignment.department_id);
                    const sec = sections.find((s) => s.id === assignment.section_id);

                    return (
                      <tr key={assignment.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{user?.full_name || 'Faculty Member'}</span>
                            {assignment.is_lead_faculty && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Lead
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">{faculty?.employee_id}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${dept?.color_accent || '#4F46E5'}15`,
                              color: dept?.color_accent || '#818CF8',
                              border: `1px solid ${dept?.color_accent || '#4F46E5'}30`,
                            }}
                          >
                            {dept?.code || 'DEPT'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{subj?.name || 'Subject'}</div>
                          <span className="text-[10px] font-mono text-indigo-400">{subj?.code}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-300">{sec?.name || 'Main Batch'}</span>
                          <span className="block text-[10px] text-zinc-500">{sec?.student_strength || 60} students</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                            {assignment.component}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {assignment.hours_per_week} hrs/wk
                        </td>

                        {currentRole !== 'FACULTY' && (
                          <td className="py-3 px-4 text-right">
                            {onRemoveFacultySubjectAssignment && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove faculty assignment for ${subj?.code}?`)) {
                                    onRemoveFacultySubjectAssignment(assignment.id);
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Unassign"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: COURSES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'courses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const dept = departments.find((d) => d.id === course.department_id);
              const courseSemesters = semesters.filter((s) => s.course_id === course.id);
              const courseSubjects = subjects.filter((s) => s.course_id === course.id);

              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-white/[0.15] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {course.degree_level}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-white">{course.name}</h3>
                    <p className="mt-1 text-xs text-zinc-400">Department: {dept?.name || dept?.code}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-800/40 text-[11px] font-mono border border-white/[0.04]">
                      <div className="text-center">
                        <span className="text-zinc-500 block text-[10px]">Duration</span>
                        <span className="font-bold text-white">{course.duration_years} Years</span>
                      </div>
                      <div className="text-center border-x border-white/[0.06]">
                        <span className="text-zinc-500 block text-[10px]">Semesters</span>
                        <span className="font-bold text-indigo-400">{course.total_semesters}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-zinc-500 block text-[10px]">Subjects</span>
                        <span className="font-bold text-emerald-400">{courseSubjects.length}</span>
                      </div>
                    </div>
                  </div>

                  {currentRole !== 'FACULTY' && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditCourse(course)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit Course"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {onDeleteCourse && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete course ${course.code}?`)) {
                              onDeleteCourse(course.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: SEMESTERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'semesters' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Semester Term</th>
                    <th className="py-3 px-4">Degree Course</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    {currentRole !== 'FACULTY' && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {semesters.map((sem) => {
                    const course = courses.find((c) => c.id === sem.course_id);
                    return (
                      <tr key={sem.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{sem.name}</span>
                          <span className="block text-[10px] text-zinc-500 font-mono">Term {sem.term_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-indigo-400">{course?.code || 'Course'}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">{sem.academic_year}</td>
                        <td className="py-3 px-4 text-zinc-400">
                          {sem.start_date} to {sem.end_date}
                        </td>
                        <td className="py-3 px-4">
                          {sem.is_archived ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">
                              Archived
                            </span>
                          ) : sem.is_current ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Active / Current
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                              Upcoming
                            </span>
                          )}
                        </td>
                        {currentRole !== 'FACULTY' && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditSemester(sem)}
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Edit Semester"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {!sem.is_archived && onArchiveSemester && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Archive ${sem.name}?`)) {
                                      onArchiveSemester(sem.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors"
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: SECTIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'sections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((sec) => {
              const sem = semesters.find((s) => s.id === sec.semester_id);
              const course = courses.find((c) => c.id === sec.course_id || c.id === sem?.course_id);
              const dept = departments.find((d) => d.id === sec.department_id);
              const assignmentsForSec = facultySubjectAssignments.filter((a) => a.section_id === sec.id);

              return (
                <div
                  key={sec.id}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-white/[0.15] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {sec.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {sec.student_strength} Students
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-white">{sem?.name || 'Active Semester'}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {course?.code} • {dept?.code}
                    </p>

                    <div className="mt-3 p-2 rounded bg-zinc-800/40 text-[11px] text-zinc-400 flex items-center justify-between">
                      <span>Scheduled Classes</span>
                      <span className="font-bold text-white">{assignmentsForSec.length} Subjects</span>
                    </div>
                  </div>

                  {currentRole !== 'FACULTY' && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditSection(sec)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit Section"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {onDeleteSection && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete section ${sec.name}?`)) {
                              onDeleteSection(sec.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL DRAWER FOR SELECTED SUBJECT */}
      {/* ========================================================================= */}
      {activeSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F0F11] border-l border-white/[0.1] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {activeSubject.code}
                </span>
                <h2 className="mt-2 text-lg font-bold text-white">{activeSubject.name}</h2>
                <p className="text-xs text-zinc-400">{activeSubjectDepartment?.name}</p>
              </div>
              <button
                onClick={() => setSelectedSubjectId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Curriculum Breakdown */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-center font-mono text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] block">Credits</span>
                <span className="text-base font-bold text-white">
                  {activeSubject.credits || activeSubject.theory_credits + activeSubject.lab_credits}
                </span>
              </div>
              <div className="border-x border-white/[0.08]">
                <span className="text-zinc-500 text-[10px] block">Lecture Hours</span>
                <span className="text-base font-bold text-indigo-400">
                  {activeSubject.theory_hours ?? activeSubject.lecture_hours_per_week ?? 3}h
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Lab / Practical</span>
                <span className="text-base font-bold text-cyan-400">
                  {activeSubject.practical_hours ?? activeSubject.lab_hours_per_week ?? 0}h
                </span>
              </div>
            </div>

            {/* Academic Context */}
            <div className="space-y-2 text-xs">
              <span className="text-zinc-400 uppercase font-mono tracking-wider text-[10px] block">Academic Mapping</span>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Course Program:</span>
                  <span className="font-semibold text-white">{activeSubjectCourse?.name || 'General Degree'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Target Semester:</span>
                  <span className="font-semibold text-white">{activeSubjectSemester?.name || 'Fall Term'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Curriculum Category:</span>
                  <span className="font-mono text-indigo-400">{activeSubject.subject_type || 'CORE'}</span>
                </div>
              </div>
            </div>

            {/* Assigned Faculty Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 uppercase font-mono tracking-wider text-[10px]">
                  Assigned Faculty Cohorts ({activeSubjectAssignments.length})
                </span>
                {currentRole !== 'FACULTY' && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId(null);
                      handleOpenAssignModal(activeSubject.id);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Assign Faculty
                  </button>
                )}
              </div>

              {activeSubjectAssignments.length > 0 ? (
                <div className="space-y-2">
                  {activeSubjectAssignments.map((a) => {
                    const faculty = facultyProfiles.find((f) => f.id === a.faculty_id);
                    const user = users.find((u) => u.id === faculty?.user_id);
                    const sec = sections.find((s) => s.id === a.section_id);
                    return (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <span>{user?.full_name}</span>
                            {a.is_lead_faculty && (
                              <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                                Lead
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {sec?.name || 'Cohort'} • {a.component}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-indigo-400 text-xs">{a.hours_per_week}h/wk</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/[0.1] text-center text-xs text-zinc-500">
                  No faculty assigned to this subject yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SUBJECT */}
      {/* ========================================================================= */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>Create New Academic Subject</span>
              </h2>
              <button onClick={() => setIsAddSubjectModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitSubject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS501"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono uppercase focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Subject Type</label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="CORE">Core Subject</option>
                    <option value="ELECTIVE">Program Elective</option>
                    <option value="LAB">Lab Practical Only</option>
                    <option value="OPEN_ELECTIVE">Open Elective</option>
                    <option value="SEMINAR">Seminar / Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Owning Department</label>
                  <select
                    value={subjectDeptId}
                    onChange={(e) => setSubjectDeptId(e.target.value)}
                    disabled={currentRole === 'ADMIN'}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Associated Course</label>
                  <select
                    value={subjectCourseId}
                    onChange={(e) => setSubjectCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">No Course Link</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Total Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={subjectCredits}
                    onChange={(e) => setSubjectCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Theory (h/wk)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={subjectTheoryHours}
                    onChange={(e) => setSubjectTheoryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Practical (h/wk)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={subjectPracticalHours}
                    onChange={(e) => setSubjectPracticalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN FACULTY TO SUBJECT & SECTION */}
      {/* ========================================================================= */}
      {isAssignFacultyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users2 className="h-5 w-5 text-indigo-400" />
                <span>Assign Faculty to Subject & Section</span>
              </h2>
              <button onClick={() => setIsAssignFacultyModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Target Subject</label>
                <select
                  value={assignTargetSubjectId}
                  onChange={(e) => setAssignTargetSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Assign Professor / Faculty</label>
                <select
                  value={assignFacultyId}
                  onChange={(e) => setAssignFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {facultyProfiles.map((f) => {
                    const u = users.find((usr) => usr.id === f.user_id);
                    return (
                      <option key={f.id} value={f.id}>
                        {u?.full_name} ({f.employee_id}) - Max: {f.max_weekly_hours}h
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Student Section Cohort</label>
                  <select
                    value={assignSectionId}
                    onChange={(e) => setAssignSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.student_strength} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Teaching Component</label>
                  <select
                    value={assignComponent}
                    onChange={(e) => setAssignComponent(e.target.value as WorkloadComponent)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="LECTURE">Theory Lecture</option>
                    <option value="LAB_PRACTICAL">Lab Practical</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="PROJECT_MENTORSHIP">Project Mentorship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Allocated Hours / Week</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={assignHours}
                    onChange={(e) => setAssignHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isLeadCheck"
                    checked={assignIsLead}
                    onChange={(e) => setAssignIsLead(e.target.checked)}
                    className="rounded bg-zinc-900 border-white/[0.1] text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="isLeadCheck" className="text-zinc-300">
                    Lead Course Instructor
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] space-y-1">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Workload Impact Automatically Calculated:
                </span>
                <p>
                  Assigning {assignHours} hours will update this faculty member's cross-department total and prevent time slot collisions in other departments during timetable generation.
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignFacultyModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE COURSE */}
      {/* ========================================================================= */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#06B6D4]" />
                <span>Create Degree Course</span>
              </h2>
              <button onClick={() => setIsAddCourseModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BTECH-CSE"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Degree Level</label>
                  <select
                    value={courseDegreeLevel}
                    onChange={(e) => setCourseDegreeLevel(e.target.value as DegreeLevel)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="UNDERGRADUATE">Undergraduate (B.Tech / B.Sc)</option>
                    <option value="POSTGRADUATE">Postgraduate (M.Tech / M.Sc)</option>
                    <option value="DOCTORATE">Doctorate (Ph.D)</option>
                    <option value="DIPLOMA">Diploma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Course Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Technology in Computer Science & Engineering"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={courseDeptId}
                    onChange={(e) => setCourseDeptId(e.target.value)}
                    disabled={currentRole === 'ADMIN'}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={courseTotalSemesters}
                    onChange={(e) => setCourseTotalSemesters(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SEMESTER */}
      {/* ========================================================================= */}
      {isAddSemesterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <span>Create Semester Term</span>
              </h2>
              <button onClick={() => setIsAddSemesterModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSemesterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Target Degree Course</label>
                <select
                  value={semCourseId}
                  onChange={(e) => setSemCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Semester Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Semester 5 (Fall 2025)"
                    value={semName}
                    onChange={(e) => setSemName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Term Number (1-14)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={semTermNumber}
                    onChange={(e) => setSemTermNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={semAcademicYear}
                    onChange={(e) => setSemAcademicYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={semStartDate}
                    onChange={(e) => setSemStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={semEndDate}
                    onChange={(e) => setSemEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSemesterModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SECTION */}
      {/* ========================================================================= */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-400" />
                <span>Create Student Cohort Section</span>
              </h2>
              <button onClick={() => setIsAddSectionModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSectionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Section Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section A"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Student Strength</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={secStudentStrength}
                    onChange={(e) => setSecStudentStrength(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Assigned Semester</label>
                <select
                  value={secSemesterId}
                  onChange={(e) => setSecSemesterId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {semesters.map((s) => {
                    const c = courses.find((crs) => crs.id === s.course_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({c?.code || 'Course'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SUBJECT */}
      {/* ========================================================================= */}
      {isEditSubjectModalOpen && targetSubjectToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Edit Academic Subject: {targetSubjectToEdit.code}</span>
              </h2>
              <button onClick={() => setIsEditSubjectModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateSubjectSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Subject Code</label>
                  <input
                    type="text"
                    disabled
                    value={subjectCode}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/[0.08] rounded-lg text-zinc-400 font-mono uppercase cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Subject Type</label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="CORE">Core Subject</option>
                    <option value="ELECTIVE">Program Elective</option>
                    <option value="LAB">Lab Practical Only</option>
                    <option value="OPEN_ELECTIVE">Open Elective</option>
                    <option value="SEMINAR">Seminar / Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Owning Department</label>
                  <select
                    value={subjectDeptId}
                    onChange={(e) => setSubjectDeptId(e.target.value)}
                    disabled={currentRole === 'ADMIN'}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Associated Course</label>
                  <select
                    value={subjectCourseId}
                    onChange={(e) => setSubjectCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">No Course Link</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Total Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={subjectCredits}
                    onChange={(e) => setSubjectCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Theory (h/wk)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={subjectTheoryHours}
                    onChange={(e) => setSubjectTheoryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Practical (h/wk)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={subjectPracticalHours}
                    onChange={(e) => setSubjectPracticalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSubjectModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT COURSE */}
      {/* ========================================================================= */}
      {isEditCourseModalOpen && targetCourseToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#06B6D4]" />
                <span>Edit Degree Course: {targetCourseToEdit.code}</span>
              </h2>
              <button onClick={() => setIsEditCourseModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateCourseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Course Code</label>
                  <input
                    type="text"
                    disabled
                    value={courseCode}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/[0.08] rounded-lg text-zinc-400 font-mono uppercase cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Degree Level</label>
                  <select
                    value={courseDegreeLevel}
                    onChange={(e) => setCourseDegreeLevel(e.target.value as DegreeLevel)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="UNDERGRADUATE">Undergraduate (B.Tech / B.Sc)</option>
                    <option value="POSTGRADUATE">Postgraduate (M.Tech / M.Sc)</option>
                    <option value="DOCTORATE">Doctorate (Ph.D)</option>
                    <option value="DIPLOMA">Diploma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Course Full Name</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={courseDeptId}
                    onChange={(e) => setCourseDeptId(e.target.value)}
                    disabled={currentRole === 'ADMIN'}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={courseTotalSemesters}
                    onChange={(e) => setCourseTotalSemesters(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCourseModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SEMESTER */}
      {/* ========================================================================= */}
      {isEditSemesterModalOpen && targetSemesterToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Edit Semester: {targetSemesterToEdit.name}</span>
              </h2>
              <button onClick={() => setIsEditSemesterModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateSemesterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Target Degree Course</label>
                <select
                  value={semCourseId}
                  onChange={(e) => setSemCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Semester Name</label>
                  <input
                    type="text"
                    required
                    value={semName}
                    onChange={(e) => setSemName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Term Number (1-14)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={semTermNumber}
                    onChange={(e) => setSemTermNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={semAcademicYear}
                    onChange={(e) => setSemAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={semStartDate}
                    onChange={(e) => setSemStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={semEndDate}
                    onChange={(e) => setSemEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSemesterModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SECTION */}
      {/* ========================================================================= */}
      {isEditSectionModalOpen && targetSectionToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-400" />
                <span>Edit Student Section: {targetSectionToEdit.name}</span>
              </h2>
              <button onClick={() => setIsEditSectionModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateSectionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Section Label</label>
                  <input
                    type="text"
                    required
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Student Strength</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={secStudentStrength}
                    onChange={(e) => setSecStudentStrength(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Assigned Semester</label>
                <select
                  value={secSemesterId}
                  onChange={(e) => setSecSemesterId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {semesters.map((s) => {
                    const c = courses.find((crs) => crs.id === s.course_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({c?.code || 'Course'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Assigned Department</label>
                <select
                  value={secDeptId}
                  onChange={(e) => setSecDeptId(e.target.value)}
                  disabled={currentRole === 'ADMIN'}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSectionModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
