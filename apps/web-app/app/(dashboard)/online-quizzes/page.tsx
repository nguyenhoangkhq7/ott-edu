import AssignmentsPage from "@/modules/assignments/AssignmentsPage";
import { AssignmentType } from "@/shared/types/quiz";

export default function OnlineQuizzesPage() {
  return <AssignmentsPage filterType={AssignmentType.QUIZ} />;
}

export const metadata = {
  title: "Online Quizzes | Learning Management System",
  description: "Complete your online quizzes and assignments",
};