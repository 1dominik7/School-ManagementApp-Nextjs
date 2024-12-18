import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  if (type !== "delete") {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        const examLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: userId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons: examLessons };
        break;
      case "lesson":
        const lessonTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        const lessonSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        relatedData = {
          teachers: lessonTeachers,
          subjects: lessonSubjects,
          classes: lessonClasses,
        };
        break;
      case "assignment":
        const assignmentLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: userId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = {
          lessons: assignmentLessons,
        };
        break;
      case "result":
        const resultExams = await prisma.exam.findMany({
          where: {
            ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
          },
          select: { id: true, title: true },
        });

        const resultAssignments = await prisma.assignment.findMany({
          where: {
            ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
          },
          select: { id: true, title: true },
        });

        const resultStudents = await prisma.lesson.findMany({
          where: {
            teacherId: userId!,
          },
          select: {
            class: {
              select: {
                students: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
              },
            },
          },
        });
        const students = resultStudents.flatMap(
          (lesson) => lesson.class?.students || []
        );
        relatedData = {
          exams: resultExams,
          assignments: resultAssignments,
          students: students,
        };
        break;
      case "event":
        const eventClass = await prisma.class.findMany({
          select: { id: true, name: true }
        });
        relatedData = {
          classes: eventClass,
        };
        break;
      case "announcement":
        const announcementClass = await prisma.class.findMany({
          select: { id: true, name: true }
        });
        relatedData = {
          classes: announcementClass,
        };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
