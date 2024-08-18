export enum VideoType {
  Storybook = 'storybook',
  Captions = 'captions',
}

export enum Style {
  Bauhaus = 'bauhaus',
  Dreamscape = 'dreamscape',
  FlatArt = 'Flat Art',
  Geometric = 'geometric',
  Minecraft = 'minecraft',
  Neon = 'neon',
  Nouveau = 'nouveau',
  Ukiyo = 'ukiyo',
  VincentVanGough = 'VincentVanGough',
//
// Flat Art
// Minimalism
  // Minimalism = 'minimalism',
  // Popart = 'popart',
  // Maximalist = 'maximalist',
  // Anime = 'anime',
  // Cyberpunk = 'cyberpunk',
  // Deco = 'deco',
  // Hyperreal = 'hyperreal',
  // Pixar = 'pixar',
}

export const styleDescriptions: { [key in Style]: string } = {
  [Style.Bauhaus]: 'Bauhaus',
  [Style.Dreamscape]: 'Surreal Dreamscape',
  [Style.FlatArt]: 'Flat Art',
  [Style.Geometric]: 'Geometric',
  [Style.Minecraft]: 'Minecraft Video Game',
  [Style.Neon]: 'Flat Neon Color Illustration',
  [Style.Nouveau]: 'Art Nouveau',
  [Style.Ukiyo]: 'Ukiyo-E',
  [Style.VincentVanGough]: 'Vincent Van Gough',
  // [Style.Minimalism]: 'Minimalism',
  // [Style.Maximalist]: 'Maximalist',
  // [Style.Anime]: 'Anime',
  // [Style.Cyberpunk]: 'Cyberpunk',
  // [Style.Hyperreal]: 'Hyper-Realistic Still Life',
  // [Style.Pixar]: 'Pixar Art',
  // [Style.Popart]: 'Pop-art',
}
