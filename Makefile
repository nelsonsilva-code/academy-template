PROJECTNAME := $(shell basename "$(PWD)")

# Make is verbose in Linux. Make it silent.
MAKEFLAGS += --silent

HELP_FUN = \
	%help; \
	while(<>) { \
		push @{$$help{$$2 // 'Options'}}, [$$1, $$3] if /^(.+)\s*:.*\#\#(?:@(\w+))?\s(.*)$$/; \
	}; \
	print "usage: make [target]\n\n"; \
	for (sort keys %help) { \
		print "$$_:\n"; \
		for (@{$$help{$$_}}) { \
			$$sep = " " x (30 - length $$_->[0]); \
			print "  $$_->[0]$$sep$$_->[1]\n"; \
		} \
		print "\n"; \
	}

.PHONY: help
all: help

help: Makefile ##@Miscellaneous Show this help.
	@echo
	@echo "Choose a command run in "$(PROJECTNAME)":"
	@echo
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)

.PHONY: create-network
create-network:
	@if ! docker network inspect pde >/dev/null 2>&1; then \
        docker network create pde; \
        echo "Network 'pde' created."; \
    else \
        echo "Network 'pde' already exists."; \
    fi

.PHONY: build
build:
	./gradlew clean build

.PHONY: docker-run
docker-run: create-network build
	COMPOSE_PROJECT_NAME=pde docker-compose -f docker-compose-template.yml up -d