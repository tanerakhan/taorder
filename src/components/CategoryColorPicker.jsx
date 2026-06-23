import {
  CATEGORY_COLOR_PRESETS,
  DEFAULT_CATEGORY_COLOR,
  normalizeCategoryColor,
} from '../constants/categoryColors';
import './CategoryColorPicker.css';

export default function CategoryColorPicker({ value, onChange }) {
  const selected = normalizeCategoryColor(value) || DEFAULT_CATEGORY_COLOR;

  return (
    <div className="category-color-picker">
      <div className="category-color-presets" role="group" aria-label="Etiket rengi">
        {CATEGORY_COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            className={`category-color-swatch ${selected === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
            aria-label={color}
            aria-pressed={selected === color}
          />
        ))}
      </div>
      <label className="category-color-custom">
        <span>Özel renk</span>
        <input
          type="color"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
