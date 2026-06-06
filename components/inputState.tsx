"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DynamicInput() {
  const [fields, setFields] = useState([""]);

  const addField = () => {
    setFields([...fields, ""]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={`Input ${index + 1}`}
            value={field}
            onChange={(e) => {
              const updated = [...fields];
              updated[index] = e.target.value;
              setFields(updated);
            }}
          />

          {fields.length > 1 && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeField(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addField}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Tambah Pengeluaran 
      </Button>
    </div>
  );
}