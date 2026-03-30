import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Tên dự án phải từ 3 ký tự trở lên" }),
  genre: z.string().optional(),
  platform: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectQuickForm() {
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  const addProject = useAppStore((state) => state.addProject);
  const { t } = useI18n();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", genre: "", platform: "" },
  });

  const { errors } = form.formState;

  const handleActualSubmit = (values: ProjectFormValues) => {
    try {
      const timestamp = new Date().toISOString();
      const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 9);

      addProject({
        id: `proj_${newId}`,
        name: values.name,
        genre: values.genre || "",
        platform: values.platform || "",
        createdAt: timestamp,
        updatedAt: timestamp,
        status: "Draft",
        targetAudience: "",
      });

      form.reset();
      console.log("Project created successfully");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (!hasHydrated) {
    return <div className="h-10 w-full animate-pulse bg-slate-100 rounded-lg" />;
  }

  return (
    <form 
      className="grid gap-3 md:grid-cols-4 items-start" 
      onSubmit={form.handleSubmit(handleActualSubmit)}
    >
      <div className="flex flex-col gap-1">
        <Input 
          placeholder="Project name" 
          {...form.register("name")} 
          className={errors.name ? "border-red-500 focus:ring-red-200" : ""}
        />
        {errors.name && (
          <span className="text-[10px] text-red-500 px-1 font-medium italic">
            {errors.name.message}
          </span>
        )}
      </div>

      <Input placeholder="Genre" {...form.register("genre")} />
      <Input placeholder="Platform" {...form.register("platform")} />
      
      <Button type="submit" className="h-10 bg-teal-600 hover:bg-teal-700 text-white">
        {t.common.create}
      </Button>
    </form>
  );
}