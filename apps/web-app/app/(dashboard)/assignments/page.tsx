import AssignmentsPage from "@/modules/assignments/AssignmentsPage";
import { AssignmentType } from "@/shared/types/quiz";

export default function Assignments() {
  return <AssignmentsPage filterType={AssignmentType.ESSAY} />;
}