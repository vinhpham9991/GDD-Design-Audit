import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const projectSchema = z.object({
  name: z.string().min(3),
  genre: z.string().optional(),
  platform: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectQuickForm() {
  const addProject = useAppStore((state) => state.addProject);
  const { t } = useI18n();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      genre: "",
      platform: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const timestamp = new Date().toISOString();

    addProject({
      id: `proj_${crypto.randomUUID()}`,
      name: values.name,
      genre: values.genre,
      platform: values.platform,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "Draft",
      targetAudience: "",
    });

    form.reset();
  });

  return (
    <form className="grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
      <Input placeholder="Project name" {...form.register("name")} />
      <Input placeholder="Genre" {...form.register("genre")} />
      <Input placeholder="Platform" {...form.register("platform")} />
      <Button type="submit">{t.common.create}</Button>
    </form>
  );
}

