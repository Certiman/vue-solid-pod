# Step Processing Debug Guide

## Changes Made to Fix Step Skipping Issue

### Problem Identified

The first step in tasks was being skipped due to:

1. **Sequence numbering starting from 0**: The original code started sequence numbering from 0, which could cause display issues
2. **Template using array indices**: The template was using array indices instead of calculated sequences
3. **relevantSteps mapping**: The computed property was only returning step objects, losing sequence information

### Changes Made

#### 1. Fixed Sequence Calculation (`TaskRunner.vue`)

```javascript
// BEFORE: Started from 0
let sequence = 0

// AFTER: Start from 1
let sequence = 1  // Changed: Start from 1 instead of 0
```

#### 2. Fixed relevantSteps Computed Property

```javascript
// BEFORE: Lost sequence information
const relevantSteps = computed(() =>
  stepsList.value.filter((sli) => sli.version == selectedVersion.value).map((sli) => sli.step)
)

// AFTER: Preserves full step objects with sequence
const relevantSteps = computed(() =>
  stepsList.value
    .filter((sli) => sli.version == selectedVersion.value)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
)
```

#### 3. Fixed Template Rendering

```vue
<!-- BEFORE: Used array indices -->
<StepItem
  v-for="[i, step] of relevantSteps.entries()"
  :key="i"
  :sequence="i"
  :step="step"
  :id="`TaskStep-${i}`"
/>

<!-- AFTER: Uses actual sequence numbers -->
<StepItem
  v-for="(stepItem, i) of relevantSteps"
  :key="stepItem.sequence || i"
  :sequence="stepItem.sequence || (i + 1)"
  :step="stepItem.step"
  :id="`TaskStep-${stepItem.sequence || i}`"
/>
```

#### 4. Added Debug Logging

- Added console logs in `processTaskDescriptor()` to show `rdf:first` pointers
- Added console logs in `processActionStep()` to show step processing details
- Added console logs in `recalculateOrder()` to show final step ordering

### How to Test

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to a task with multiple steps**

3. **Open browser console** and look for debug messages:
   - "Task descriptor rdf:first pointers:" - Shows starting points
   - "Processing action step:" - Shows each step being processed
   - "Processing version X with starting point:" - Shows sequence calculation
   - "Assigned sequence X to step Y" - Shows sequence assignment
   - "Final stepsList after recalculateOrder:" - Shows final ordering

4. **Check if steps are displayed correctly**:
   - First step should now appear as Step 1
   - All steps should be in proper order
   - No steps should be skipped

### Expected TURTLE Data Processing

For your task data:
```turtle
<addC2T> rdf:first #1748932739493 .

#1748932739493 a dul:Action ;
    schema:version 1 ;
    rdf:rest #1748934693192 .

#1748934693192 a dul:Action ;
    schema:version 1 ;
    rdf:rest () .
```

Expected result:
- Step `#1748932739493` gets sequence 1
- Step `#1748934693192` gets sequence 2
- Both steps should be displayed in order

### If Issues Persist

Check the browser console for:
1. Any errors in step processing
2. The debug logs showing proper sequence assignment
3. Whether the `relevantSteps` computed property returns the expected steps

Remove this debug file after confirming the fix works.
