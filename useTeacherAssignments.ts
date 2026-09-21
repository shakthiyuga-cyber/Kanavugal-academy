import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { TeacherAssignment, Subject, Section, Grade } from "@/types/database";

export interface TeacherAssignmentJoined extends TeacherAssignment {
  subject: Subject;
  section: Section & { grade: Grade };
}

/** Which grade/section/subject combinations this teacher is assigned to teach. */
export function useTeacherAssignments() {
  const { session } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignmentJoined[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    supabase
      .from("teacher_assignments")
      .select("*, subject:subjects(*), section:sections(*, grade:grades(*))")
      .eq("teacher_id", session.user.id)
      .then(({ data }) => setAssignments((data as any[]) ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  return { assignments, loading };
}
