-- 상위 태스크(그룹) 여부
ALTER TABLE it_tasks
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false;

-- 기존에 하위 태스크가 있는 태스크는 그룹으로 표시
UPDATE it_tasks AS parent
SET is_group = true
WHERE EXISTS (
  SELECT 1 FROM it_tasks AS child
  WHERE child.parent_task_id = parent.id
);

NOTIFY pgrst, 'reload schema';
