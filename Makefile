
build: components index.js socket-monitor.css template.js
	@component build --dev

template.js: template.html
	@component convert $<

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

test:
	@cd test && open http://localhost:3545 && node serve.js

example:
	@open test/example.html

.PHONY: clean test example
