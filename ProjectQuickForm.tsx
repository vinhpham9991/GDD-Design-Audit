import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Tên dự án phải có ít nhất 3 ký tự" }),
  genre: z.string().optional(),
  platform: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectQuickForm() {
  const [isReady, setIsReady] = useState(false);
  const addProject = useAppStore((state) => state.addProject);
  const { t } = useI18n();

  // Đảm bảo Store đã đồng bộ xong với LocalStorage trước khi render để tránh lỗi trên Vercel
  useEffect(() => {
    setIsReady(true);
  }, []);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      genre: "",
      platform: "",
    },
  });

  // Trích xuất lỗi để hiển thị cho người dùng
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    try {
      const timestamp = new Date().toISOString();
      
      // Sử dụng crypto.randomUUID an toàn hơn trong môi trường HTTPS của Vercel
      const newId = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);

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
    } catch (error) {
      console.error("Lỗi khi tạo dự án:", error);
    }
  });

  if (!isReady) return null;

  return (
    <div className="flex flex-col gap-2">
      <form className="grid gap-3 md:grid-cols-4 items-start" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <Input 
            placeholder="Project name" 
            {...form.register("name")} 
            className={errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.name && (
            <span className="text-[10px] text-red-500 font-medium px-1">
              {errors.name.message}
            </span>
          )}
        </div>

        <Input placeholder="Genre" {...form.register("genre")} />
        <Input placeholder="Platform" {...form.register("platform")} />
        
        <Button type="submit" className="h-10">
          {t.common.create}
        </Button>
      </form>
    </div>
  );
}