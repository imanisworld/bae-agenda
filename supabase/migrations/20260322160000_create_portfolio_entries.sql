-- ============================================================
-- Portfolio Entries — DJ B.A.E. gig history
-- ============================================================

create table portfolio_entries (
  id          uuid      default gen_random_uuid() primary key,
  event_name  text      not null,
  venue       text,
  city        text      not null,
  year        integer   not null,
  date        date,
  tags        text[]    default '{}',
  photo_url   text,
  featured    boolean   default false,
  notes       text,
  created_at  timestamptz default now()
);

alter table portfolio_entries enable row level security;

create policy "Public can read portfolio entries"
  on portfolio_entries for select
  using (true);

create policy "Authenticated users can manage portfolio entries"
  on portfolio_entries for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- Seed — full gig history
-- ============================================================

insert into portfolio_entries (event_name, venue, city, year, tags, featured) values

-- 2025
('6th Annual International Women''s Gathering',  null,                       'Indianapolis, IN', 2025, '{Community, Festival}',             false),
('Club Plex powered by Karlala Soundsystem',      'Club Plex',               'Indianapolis, IN', 2025, '{Nightlife, Residency}',             false),
('Sundry & Vice',                                 null,                       'Indianapolis, IN', 2025, '{Nightlife}',                        false),
('House of Queer',                                null,                       'Indianapolis, IN', 2025, '{Queer, Community}',                 false),
('Indy Gay Market',                               null,                       'Indianapolis, IN', 2025, '{Community, Market}',                false),
('Art Show @ Madam Walker Legacy Center',         'Madam Walker Legacy Center','Chicago, IL',    2025, '{Art, Cultural}',                    true),
('Chi Chi''s Resident DJ',                        'Blind Tiger Indy',        'Indianapolis, IN', 2025, '{Residency, Nightlife, Queer}',      false),
('Club Cunt',                                     null,                       'Indianapolis, IN', 2025, '{Nightlife, Queer}',                 false),
('Indy Artgarden Art Show',                       'Artsgarden',              'Indianapolis, IN', 2025, '{Art, Cultural}',                    false),
('HoopVision',                                    null,                       'Indianapolis, IN', 2025, '{Sports, Community}',                false),
('WNBA All-Star Weekend',                         null,                       'Indianapolis, IN', 2025, '{Sports, Festival, Corporate}',      true),

-- 2024
('Columbus Area Arts',                            null,                       'Columbus, IN',     2024, '{Art, Community}',                   false),
('J.U.I.C.Y',                                    null,                       'Indianapolis, IN', 2024, '{Nightlife}',                        false),
('SweatBox',                                      null,                       'Indianapolis, IN', 2024, '{Nightlife}',                        false),
('Plex Airplay',                                  'Club Plex',               'Indianapolis, IN', 2024, '{Nightlife}',                        false),
('Butter 2024 Art Festival',                      null,                       'Indianapolis, IN', 2024, '{Art, Festival}',                    true),
('Spark Indy Chreece',                            null,                       'Indianapolis, IN', 2024, '{Music, Festival}',                  false),
('Indy Sleaze',                                   null,                       'Indianapolis, IN', 2024, '{Nightlife, Queer}',                 false),
('Harrison Center First Fridays',                 'Harrison Center',         'Indianapolis, IN', 2024, '{Art, Community, Recurring}',        true),
('Nourishing Well: Black Women and the Poetics of Sacred Space', null,        'Indianapolis, IN', 2024, '{Cultural, Community}',              false),
('Boss Babe Brunch',                              null,                       'Indianapolis, IN', 2024, '{Brunch, Community}',                false),
('Legacy Festival',                               null,                       'Indianapolis, IN', 2024, '{Festival, Community}',              false),
('Rock N Roll Festival',                          null,                       'Indianapolis, IN', 2024, '{Festival}',                         false),
('Pacers Bikeshare E-Bike',                       null,                       'Indianapolis, IN', 2024, '{Corporate, Community}',             false),
('IYG Youth Prom',                                null,                       'Indianapolis, IN', 2024, '{Youth, Queer, Community}',          false),
('IUPUI The Howl Festival',                       null,                       'Indianapolis, IN', 2024, '{Festival, University}',             false),
('1000 Words Indy Noir Art Show',                 null,                       'Indianapolis, IN', 2024, '{Art, Cultural}',                    false),
('Damien Center & IYG Garage Dance Party',        null,                       'Indianapolis, IN', 2024, '{Community, Queer}',                 false),
('Boss Ladies Gala',                              null,                       'Indianapolis, IN', 2024, '{Gala, Community}',                  false),
('All Star Weekend @ The Cultural Corridor',      'The Cultural Corridor',   'Indianapolis, IN', 2024, '{Sports, Festival, Cultural}',       false),
('Trap X Tacos',                                  null,                       'Indianapolis, IN', 2024, '{Nightlife, Community}',             false),
('Family & Friends R&B Night',                    null,                       'Indianapolis, IN', 2024, '{R&B, Private}',                     false),
('Red Lion Lounge',                               'Red Lion Lounge',         'Indianapolis, IN', 2024, '{Nightlife}',                        false),

-- 2023
('Queer Dance Party w/Indy Pride',                null,                       'Indianapolis, IN', 2023, '{Queer, Community}',                 false),
('Spin Warz',                                     null,                       'Indianapolis, IN', 2023, '{DJ Battle, Music}',                 false),
('Evansville Culture Festival',                   null,                       'Evansville, IN',   2023, '{Festival, Cultural}',               false),
('Juneteenth Columbus Festival',                  null,                       'Columbus, IN',     2023, '{Juneteenth, Festival, Cultural}',   false),
('One Drop Art Show',                             null,                       'Indianapolis, IN', 2023, '{Art}',                              false),
('GangGang Game Night',                           null,                       'Indianapolis, IN', 2023, '{Community}',                        false),
('Purdue Polytechnic Prom',                       null,                       'Indianapolis, IN', 2023, '{Prom, University}',                 false),
('Purdue Polytechnic Homecoming',                 null,                       'Indianapolis, IN', 2023, '{Homecoming, University}',           false),
('Club Plex Resident DJ',                         'Club Plex',               'Indianapolis, IN', 2023, '{Residency, Nightlife}',             false),
('Indy Pride Festival',                           null,                       'Indianapolis, IN', 2023, '{Pride, Festival, Queer}',           true),
('Lafayette Pride',                               null,                       'Lafayette, IN',    2023, '{Pride, Queer}',                     false),
('Indy Big Gay Market',                           null,                       'Indianapolis, IN', 2023, '{Queer, Market, Community}',         false),
('MilkTooth Butter Mixer',                        'MilkTooth',               'Indianapolis, IN', 2023, '{Art, Community}',                   false),
('Melt Butter Official Afterparty',               null,                       'Indianapolis, IN', 2023, '{Afterparty, Art}',                  false),
('Chreece Music Festival',                        null,                       'Indianapolis, IN', 2023, '{Festival, Hip-Hop, Music}',         true),
('Butter Art Fair',                               null,                       'Indianapolis, IN', 2023, '{Art, Festival}',                    false),
('Ya''ll For All',                                null,                       'Indianapolis, IN', 2023, '{Community}',                        false),
('That Peace Open Mic',                           null,                       'Indianapolis, IN', 2023, '{Open Mic, Community}',              false),

-- 2022
('BossBabeNetwork',                               null,                       'Indianapolis, IN', 2022, '{Community, Corporate}',             false),
('Butter Art Fair',                               null,                       'Indianapolis, IN', 2022, '{Art, Festival}',                    false),
('Lari Pati',                                     null,                       'Indianapolis, IN', 2022, '{Nightlife}',                        false),
('Mission Control',                               null,                       'Indianapolis, IN', 2022, '{Nightlife}',                        false),
('Trap and Soul Yoga',                            null,                       'Indianapolis, IN', 2022, '{Wellness, Community}',              false),
('PPHS Homecoming',                               null,                       'Indianapolis, IN', 2022, '{Homecoming}',                       false),

-- 2019
('Chreece Music Festival',                        null,                       'Indianapolis, IN', 2019, '{Festival, Hip-Hop, Music}',         true),
('100 Black Men Silent Party',                    null,                       'Indianapolis, IN', 2019, '{Community, Silent Party}',          false),
('Urban League',                                  null,                       'Indianapolis, IN', 2019, '{Community, Nonprofit}',             false),
('Cubby Bear',                                    'Cubby Bear',              'Chicago, IL',      2019, '{Nightlife}',                        false),
('Sub T',                                         'SubTerranean',            'Chicago, IL',      2019, '{Nightlife}',                        false),

-- 2018
('Epic Silent Party',                             null,                       'Indianapolis, IN', 2018, '{Silent Party}',                     false),
('ICON Lounge',                                   'ICON Lounge',             'Indianapolis, IN', 2018, '{Nightlife}',                        false),
('House of Blues',                                'House of Blues',          'Chicago, IL',      2018, '{Nightlife, Venue}',                  true),
('Indiana State University Homecoming',           null,                       'Terre Haute, IN',  2018, '{Homecoming, University}',           false),
('Sycamore Sessions',                             null,                       'Indianapolis, IN', 2018, '{Music, Community}',                 false),
('Bless The Mic Open Mic',                        null,                       'Indianapolis, IN', 2018, '{Open Mic, Community}',              false),
('ATL Center Stage',                              'Center Stage',            'Atlanta, GA',      2018, '{Nightlife, Venue}',                  false);
