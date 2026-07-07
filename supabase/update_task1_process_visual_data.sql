-- Upgrade the existing published Task 1 process prompt with structured
-- visual_data. This does not change prompt text, sample answers, status, or
-- any attempts/history rows.
with updated_task as (
  update public.writing_tasks
  set visual_data = '{
  "type": "process_diagram",
  "title": "Household plastic waste recycling process",
  "description": "The diagram shows how a city recycles household plastic waste into new products, including the main material losses and final outputs.",
  "is_cycle": false,
  "stages": [
    {
      "label": "Household collection",
      "description": "Residents place used plastic items in separate recycling bins."
    },
    {
      "label": "Transport",
      "description": "A collection truck carries the plastic waste to a materials recovery facility."
    },
    {
      "label": "Sorting",
      "description": "The material is sorted into PET bottles, mixed rigid plastics and plastic film; 120 kg of contaminants are removed from each 1,000 kg collected."
    },
    {
      "label": "Initial processing",
      "description": "PET and rigid plastics are shredded, while plastic film is compacted into bales."
    },
    {
      "label": "Washing and drying",
      "description": "Shredded plastic is washed to remove labels and residue, then dried; 80 kg is lost at this stage."
    },
    {
      "label": "Melting and extrusion",
      "description": "Clean plastic flakes are melted and extruded into 800 kg of plastic pellets."
    },
    {
      "label": "Manufacturing",
      "description": "The pellets are made into 300 kg of clothing fibres, 280 kg of food containers and 220 kg of outdoor furniture."
    },
    {
      "label": "Landfill disposal",
      "description": "Non-recyclable contaminants, such as metal caps and heavily soiled items, are sent to landfill."
    }
  ]
}'::jsonb
  where id = '1d7bf4f8-af0b-4aa0-836f-8cffc6f0fc2f'
  returning id
)

insert into public.admin_logs (
  admin_user_id,
  action,
  target_type,
  target_id,
  metadata
)
select
  null,
  'content_updated',
  'writing_task',
  id,
  jsonb_build_object(
    'note', 'Upgrade Task 1 process prompt with process_diagram visual_data',
    'changed_fields', jsonb_build_array('visual_data'),
    'visual_data_type', 'process_diagram'
  )
from updated_task;
