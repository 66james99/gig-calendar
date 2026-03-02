-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS public.event
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    name text,
    venue integer NOT NULL,
    event_type integer NOT NULL,
    date date NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (uuid),
    UNIQUE (name, date, venue)
);

CREATE TABLE IF NOT EXISTS public.venue
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (uuid)
);

CREATE TABLE IF NOT EXISTS public.promoter
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (uuid)
);

CREATE TABLE IF NOT EXISTS public.performer
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (uuid)
);

CREATE TABLE IF NOT EXISTS public.event_type
(
    id serial NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

COMMENT ON TABLE public.event_type
    IS 'The types of event possible - examples music gig, music festival, comedy gig';

CREATE TABLE IF NOT EXISTS public.event_promoter
(
    event integer NOT NULL,
    promoter integer NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    "primary" boolean NOT NULL,
    PRIMARY KEY (event, promoter)
);

CREATE TABLE IF NOT EXISTS public.event_performer
(
    event integer NOT NULL,
    performer integer NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    headliner boolean NOT NULL,
    slot integer NOT NULL DEFAULT 0,
    PRIMARY KEY (event, performer),
    CONSTRAINT "One performer per slot" UNIQUE (event, slot)
);

CREATE TABLE IF NOT EXISTS public.performer_alias
(
    id serial NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    performer integer NOT NULL,
    alias text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (alias)
);

CREATE TABLE IF NOT EXISTS public.venue_alias
(
    id serial NOT NULL,
    venue integer NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    alias text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (alias)
);

CREATE TABLE IF NOT EXISTS public.image_location
(
    id serial NOT NULL,
    root text NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    pattern text NOT NULL,
    date_from_exif boolean NOT NULL DEFAULT FALSE,
    include_parent boolean NOT NULL DEFAULT FALSE,
    ignore_dirs text[],
    active boolean NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE (root, pattern)
);

CREATE TABLE IF NOT EXISTS public.source_image
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    event integer NOT NULL,
    source integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.image_location_scans
(
    id serial NOT NULL,
    location integer NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    updated timestamp without time zone NOT NULL DEFAULT now(),
    scan_time timestamp without time zone NOT NULL DEFAULT now(),
    successful integer NOT NULL DEFAULT 0,
    inconsistent integer NOT NULL DEFAULT 0,
    failed integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.event
    ADD CONSTRAINT "Venue for Event" FOREIGN KEY (venue)
    REFERENCES public.venue (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public.event
    ADD CONSTRAINT "Event Type" FOREIGN KEY (event_type)
    REFERENCES public.event_type (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public.event_promoter ADD FOREIGN KEY (promoter) REFERENCES public.promoter (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;
ALTER TABLE IF EXISTS public.event_promoter ADD FOREIGN KEY (event) REFERENCES public.event (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

ALTER TABLE IF EXISTS public.event_performer ADD FOREIGN KEY (performer) REFERENCES public.performer (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;
ALTER TABLE IF EXISTS public.event_performer ADD FOREIGN KEY (event) REFERENCES public.event (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

ALTER TABLE IF EXISTS public.performer_alias ADD FOREIGN KEY (performer) REFERENCES public.performer (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

ALTER TABLE IF EXISTS public.venue_alias ADD FOREIGN KEY (venue) REFERENCES public.venue (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

ALTER TABLE IF EXISTS public.source_image ADD FOREIGN KEY (source) REFERENCES public.image_location (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;
ALTER TABLE IF EXISTS public.source_image ADD FOREIGN KEY (event) REFERENCES public.event (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

ALTER TABLE IF EXISTS public.image_location_scans ADD FOREIGN KEY (location) REFERENCES public.image_location (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS public.image_location_scans;
DROP TABLE IF EXISTS public.source_image;
DROP TABLE IF EXISTS public.image_location;
DROP TABLE IF EXISTS public.venue_alias;
DROP TABLE IF EXISTS public.performer_alias;
DROP TABLE IF EXISTS public.event_performer;
DROP TABLE IF EXISTS public.event_promoter;
DROP TABLE IF EXISTS public.event;
DROP TABLE IF EXISTS public.event_type;
DROP TABLE IF EXISTS public.performer;
DROP TABLE IF EXISTS public.promoter;
DROP TABLE IF EXISTS public.venue;
-- +goose StatementEnd