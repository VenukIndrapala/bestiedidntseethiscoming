// Letter scene logic (from valentine-confession.js).
// Same behaviour as before; only the selectors changed to the vc- classes.
$(function () {
	$("#messageState").on("change", () => {
		$(".vc-message").removeClass("openNor").removeClass("closeNor");
		if ($("#messageState").is(":checked")) {
			$(".vc-message").removeClass("closed").removeClass("no-anim").addClass("openNor");
			$(".vc-heart").removeClass("closeHer").removeClass("openedHer").addClass("openHer");
			$(".vc-container").stop().animate({ "backgroundColor": "#f48fb1" }, 2000);
		} else {
			$(".vc-message").removeClass("no-anim").addClass("closeNor");
			$(".vc-heart").removeClass("openHer").removeClass("openedHer").addClass("closeHer");
			$(".vc-container").stop().animate({ "backgroundColor": "#fce4ec" }, 2000);
		}
	});

	$(".vc-message").on("webkitAnimationEnd oanimationend msAnimationEnd animationend", function () {
		if ($(".vc-message").hasClass("closeNor"))
			$(".vc-message").addClass("closed");
		$(".vc-message").removeClass("openNor").removeClass("closeNor").addClass("no-anim");
	});

	$(".vc-heart").on("webkitAnimationEnd oanimationend msAnimationEnd animationend", function () {
		if (!$(".vc-heart").hasClass("closeHer"))
			$(".vc-heart").addClass("openedHer").addClass("beating");
		else
			$(".vc-heart").addClass("no-anim").removeClass("beating");
		$(".vc-heart").removeClass("openHer").removeClass("closeHer");
	});
});
