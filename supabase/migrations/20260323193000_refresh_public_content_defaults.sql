-- Normalize legacy public-facing content values to current launch copy.

update site_content
set value = 'https://soundcloud.com/deejaybae'
where key = 'soundcloud_url'
  and value in ('https://soundcloud.com/djbae', 'https://soundcloud.com/deejaybae/');

update site_content
set value = 'From the South Side of Chicago, DJ B.A.E. brings a sound shaped by genre-defying curiosity. Her artistic journey deepened during her years in Boston, where the intersection of visual art and music helped ignite her creative fire. Now based in Indianapolis, DJ B.A.E. is known for genre-fluid sets that move between hip-hop, R&B, bass, house, juke, ATL bass, Jersey and Baltimore club, jungle, baile, and underground edits with intention and cultural awareness. With over five years behind the decks, she has played everything from art shows to community events and festivals. A graduate of Deckademics, she continues to sharpen her turntablism and scratching while holding down a professional career as an IT specialist with a degree in Computer Engineering. Whether activating a dancefloor, curating community spaces, or blending edits made by underground artists and friends, DJ B.A.E. is more than a DJ: she is a connector, a technician, and a vessel for the stories living in the music.'
where key = 'about_quote'
  and value in (
    'Chicago-based DJ, curator, and experience architect.',
    'Chicago-based DJ, curator, and experience architect. Every set is built to be felt.'
  );
