## Adding new icon

Add new icons in `src/assets/icons/utility` path with `icon-` prefix. ICons should be a valid svg files with color set to `currentColor` so we can control their color using styles.

Update utility-icons file with your icon naming.

```
{
  name: "Icon Name",
  value: "utility-download", // utility = directory & download = file name without prefix
  description: "Download",
},
```

We have 2 mapping files - 1 for sanity where we load all icons and show them in the dropdown later.
And `client-map` which is used in UI - where we don't need to load all icons to the bundle so they are lazy loaded.
Follow the pattern and add your new icon to both files.

### Creating new icon types
There may be a need to add new type of icons which will be available in specific places. But it involves more changes. First you need to modify how you use "icon" in sanity and extend model. By default we injected utility icons there but you can overwrite that with this code:

```
extendModel(iconField, {
  name: "icon",
  options: {
    list: [
      ...navigationIcons.map((icon) => ({
        title: icon.name,
        value: icon.value,
      })),
      ...newIcons.map((icon) => ({
        title: icon.name,
        value: icon.value,
      })),
    ],
  },
}),
```

Then you need to create a new directory in `src/icons` like `src/icons/navigationItems` if we look at above sample. And prefix all icons there with `icon-` to keep the pattern.
Then you need to create new const files and directory based on utility example.
