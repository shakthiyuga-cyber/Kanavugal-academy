import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyStudentProfile } from "@/api/lms";
import type { StudentProfile } from "@/types/database";

/** Convenience hook: the logged-in student's grade/section (null while loading, or for non-students). */
export function useStudentProfile() {
  const { session } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!session?.user) {
      setLoading(false);
      return;
    }
    getMyStudentProfile(session.user.id)
      .then((sp) => mounted && setStudentProfile(sp))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [session]);

  return { studentProfile, loading };
}
